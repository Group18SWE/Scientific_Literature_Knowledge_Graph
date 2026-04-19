import re
import json
import logging
from typing import Any, Optional
from neo4j import AsyncGraphDatabase
from core.config import settings
import asyncio

logger = logging.getLogger(__name__)


def _to_json_safe(value: Any) -> Any:
    """
    Recursively convert values to JSON-serializable primitives.
    """
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, dict):
        return {str(k): _to_json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_to_json_safe(v) for v in value]
    return str(value)


def _is_neo4j_primitive(value: Any) -> bool:
    return value is None or isinstance(value, (str, int, float, bool))


def _serialize_metadata_for_neo4j(metadata: dict[str, Any]) -> dict[str, Any]:
    """
    Neo4j properties can be primitives or lists of primitives.
    Nested dict/list structures are JSON-stringified.
    """
    serialized: dict[str, Any] = {}
    for key, value in metadata.items():
        if _is_neo4j_primitive(value):
            serialized[key] = value
            continue

        if isinstance(value, list):
            if all(_is_neo4j_primitive(item) for item in value):
                serialized[key] = value
            else:
                serialized[key] = json.dumps(value, ensure_ascii=False)
            continue

        if isinstance(value, dict):
            serialized[key] = json.dumps(value, ensure_ascii=False)
            continue

        serialized[key] = str(value)

    return serialized


_JSON_METADATA_FIELDS = {
    "authors",
    "publicationVenue",
    "openAccessPdf",
    "externalIds",
    "language",
    "identifiers",
    "contributors",
    "dataProviders",
    "journals",
    "links",
}


def _deserialize_metadata_from_neo4j(metadata: dict[str, Any]) -> dict[str, Any]:
    parsed = dict(metadata)
    for key in _JSON_METADATA_FIELDS:
        raw = parsed.get(key)
        if not isinstance(raw, str):
            continue
        try:
            parsed[key] = json.loads(raw)
        except (TypeError, ValueError):
            continue
    return parsed

class Neo4jConnection:
    def __init__(self):
        self.driver = None

    async def connect(self):
        try:
            uri = settings.NEO4J_URI
            user = settings.NEO4J_USER
            password = settings.NEO4J_PASSWORD
            
            assert uri is not None, "Neo4j URI is missing"
            assert user is not None, "Neo4j User is missing"
            assert password is not None, "Neo4j Password is missing"
            
            auth = (user, password)
            # Upgraded to AsyncGraphDatabase for high-concurrency worker compatibility
            self.driver = AsyncGraphDatabase.driver(uri, auth=auth)
            
            await self.driver.verify_connectivity()
            print("🟢 Successfully connected to Neo4j AuraDB!")
        except Exception as e:
            print(f"🔴 Failed to connect to Neo4j: {e}")

    async def close(self):
        if self.driver is not None:
            await self.driver.close()
            print("🛑 Neo4j connection closed.")

# Create a single instance to use throughout the app
db = Neo4jConnection()


# ---------------------------------------------------------------------------
# UTILITY FUNCTIONS
# ---------------------------------------------------------------------------

def generate_node_id(prefix: str, label: str) -> str:
    """
    Creates stable, unique IDs for the frontend (e.g., 'model_resnet_50').
    Strips special characters and replaces spaces with underscores.
    """
    # Remove non-alphanumeric chars and replace spaces with underscores
    clean_label = re.sub(r'[^a-zA-Z0-9\s]', '', label).strip().lower()
    clean_label = re.sub(r'\s+', '_', clean_label)
    return f"{prefix}_{clean_label}"


# ---------------------------------------------------------------------------
# DATABASE OPERATIONS
# ---------------------------------------------------------------------------

async def check_if_paper_exists(paper_id: str) -> bool:
    """
    Queries Neo4j to see if a Paper node with this ID is already indexed.
    """
    if db.driver is None:
        return False
        
    query = "MATCH (p:Paper {id: $paper_id}) RETURN p.id LIMIT 1"
    
    # We use execute_read for safe, read-only queries
    async with db.driver.session() as session:
        result = await session.run(query, paper_id=paper_id)
        record = await result.single()
        return record is not None

async def save_graph_to_db(paper_id: str, entities: dict[str, Any], paper_metadata: Optional[dict[str,Any]] = None):
    """
    Takes the JSON from Gemma and writes it into Neo4j using MERGE to avoid duplicates.
    """
    print(f"[START] save_graph_to_db called for paper_id={paper_id}")

    if db.driver is None:
        print("[ERROR] Database driver is None. Cannot proceed.")
        return
        
    if paper_metadata is None:
        print("[INFO] No metadata provided. Using empty dict.")
        paper_metadata = {}
    else:
        print(f"[INFO] Metadata received with keys: {list(paper_metadata.keys())}")
        paper_metadata = _serialize_metadata_for_neo4j(paper_metadata)

    # Format models with our stable IDs
    models_data = []
    try:
        for m in entities.get("models", []):
            m_copy = dict(m)
            m_copy["id"] = generate_node_id("model", m_copy["label"])
            models_data.append(m_copy)
        print(f"[INFO] Processed {len(models_data)} models.")
    except Exception as e:
        print(f"[ERROR] Failed while processing models: {e}")
        models_data = []

    # Format datasets with our stable IDs
    datasets_data = []
    try:
        for d in entities.get("datasets", []):
            d_copy = dict(d)
            d_copy["id"] = generate_node_id("dataset", d_copy["label"])
            datasets_data.append(d_copy)
        print(f"[INFO] Processed {len(datasets_data)} datasets.")
    except Exception as e:
        print(f"[ERROR] Failed while processing datasets: {e}")
        datasets_data = []

    # Define the Neo4j Transaction
    async def _insert_graph_tx(tx):
        print("[TXN] Transaction started")

        # 1. MERGE Paper Node
        try:
            result = await tx.run("""
                MERGE (p:Paper {id: $paper_id})
                SET p += $metadata,
                    p.type = 'paper'
            """, paper_id=paper_id, metadata=paper_metadata)
            print(f"[SUCCESS] Paper node merged: {paper_id}")

            await result.consume()
        except Exception as e:
            print(f"[ERROR] Failed to MERGE Paper node: {e}")
            raise

        # 2. Models
        if models_data:
            print(f"[TXN] Inserting {len(models_data)} models...")
            try:
                result1 = await tx.run("""
                    MATCH (p:Paper {id: $paper_id})
                    UNWIND $models AS model
                    
                    MERGE (m:Model {id: model.id})
                    
                    SET m.label = model.label,
                        m.type = 'model',
                        m.framework = coalesce(model.framework, m.framework),
                        m.task = coalesce(model.task, m.task),
                        m.paramCount = coalesce(model.paramCount, m.paramCount)
                        
                    MERGE (p)-[:USES_MODEL]->(m)
                """, paper_id=paper_id, models=models_data)
                print(f"[SUCCESS] Models inserted and linked for paper {paper_id}")

                await result1.consume()
            except Exception as e:
                print(f"[ERROR] Failed inserting models: {e}")
                raise
        else:
            print("[INFO] No models to insert.")

        # 3. Datasets
        if datasets_data:
            print(f"[TXN] Inserting {len(datasets_data)} datasets...")
            try:
                result2 = await tx.run("""
                    MATCH (p:Paper {id: $paper_id})
                    UNWIND $datasets AS dataset
                    
                    MERGE (d:Dataset {id: dataset.id})
                    SET d.label = dataset.label,
                        d.type = 'dataset',
                        d.size = coalesce(dataset.size, d.size),
                        d.task = coalesce(dataset.task, d.task)
                        
                    MERGE (p)-[:USES_DATASET]->(d)
                """, paper_id=paper_id, datasets=datasets_data)
                print(f"[SUCCESS] Datasets inserted and linked for paper {paper_id}")
                await result2.consume()
            except Exception as e:
                print(f"[ERROR] Failed inserting datasets: {e}")
                raise
        else:
            print("[INFO] No datasets to insert.")

        print("[TXN] Transaction completed successfully")

    # Execute the write transaction
    try:
        print("[SESSION] Opening Neo4j session...")
        async with db.driver.session() as session:
            print("[SESSION] Executing write transaction...")
            await session.execute_write(_insert_graph_tx)
            print(f"[SUCCESS] Graph saved successfully for paper_id={paper_id}")
    except Exception as e:
        print(f"[FATAL] Failed to save graph for paper_id={paper_id}: {e}")



async def get_graph_for_papers(paper_ids: list[str]) -> dict:
    if db.driver is None:
        logger.warning("⚠️ Neo4j driver not initialized")
        return {"nodes": [], "edges": []}

    query = """
    MATCH (p:Paper) WHERE p.id IN $paper_ids
    OPTIONAL MATCH (p)-[r]->(target)
    RETURN p, r, target
    """

    nodes = {}
    edges = []

    try:
        print(f"📊 Fetching graph for {len(paper_ids)} papers")

        async with db.driver.session() as session:
            print("⏳ Running Neo4j query with timeout...")

            result = await asyncio.wait_for(
                session.run(query, paper_ids=paper_ids),
                timeout=10  # seconds
            )

            print("📡 Query sent, streaming results...")

            records = []
            async for record in result:
                records.append(record)

            await result.consume()

            print(f"📦 Retrieved {len(records)} records safely")

        print(f"📦 Retrieved {len(records)} records from Neo4j")

        for record in records:
            try:
                paper_node = record.get("p")

                if not paper_node:
                    print("⚠️ Missing paper node in record")
                    continue

                p_id = paper_node["id"]

                if p_id not in nodes:
                    paper_metadata = _deserialize_metadata_from_neo4j(dict(paper_node))
                    nodes[p_id] = {
                        "id": p_id,
                        "type": paper_node.get("type", "paper"),
                        "label": paper_node.get("title", "Unknown Title"),
                        "metadata": _to_json_safe(paper_metadata)
                    }

                target_node = record.get("target")
                rel = record.get("r")

                if target_node and rel:
                    t_id = target_node["id"]

                    if t_id not in nodes:
                        nodes[t_id] = {
                            "id": t_id,
                            "type": target_node.get("type"),
                            "label": target_node.get("label"),
                            "metadata": _to_json_safe(dict(target_node))
                        }

                    edges.append({
                        "id": f"{p_id}-{t_id}",
                        "source": p_id,
                        "target": t_id,
                        "type": rel[1] if isinstance(rel, tuple) else "CONNECTED_TO"
                    })

            except Exception as record_error:
                logger.error(f"❌ Error processing record: {record_error}", exc_info=True)

        print(f"✅ Graph built: {len(nodes)} nodes, {len(edges)} edges")

    except Exception as e:
        print("exception occurring??")
        # logger.error(f"🔥 Neo4j query failed: {e}", exc_info=True)
        return {"nodes": [], "edges": []}
    print("bro return pls ")
    return {
        "nodes": list(nodes.values()),
        "edges": edges
    }
