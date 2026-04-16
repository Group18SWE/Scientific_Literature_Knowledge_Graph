import re
from typing import Any, Optional
from neo4j import AsyncGraphDatabase
from core.config import settings

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

async def check_if_paper_enriched(paper_id: str) -> bool:
    """
    Returns True when a Paper already has model/dataset enrichment edges.
    """
    if db.driver is None:
        return False

    query = """
    MATCH (p:Paper {id: $paper_id})
    OPTIONAL MATCH (p)-[r:USES_MODEL|USES_DATASET]->()
    RETURN count(r) > 0 AS enriched
    """

    async with db.driver.session() as session:
        result = await session.run(query, paper_id=paper_id)
        record = await result.single()
        return bool(record and record.get("enriched"))


async def save_graph_to_db(paper_id: str, entities: dict[str, Any], paper_metadata: Optional[dict[str,Any]] = None):
    """
    Takes the JSON from Gemma and writes it into Neo4j using MERGE to avoid duplicates.
    """
    if db.driver is None:
        print("⚠️ Database not connected!")
        return
        
    if paper_metadata is None:
        paper_metadata = {}

    # Format models with our stable IDs
    models_data = []
    for m in entities.get("models", []):
        m_copy = dict(m)
        m_copy["id"] = generate_node_id("model", m_copy["label"])
        models_data.append(m_copy)

    # Format datasets with our stable IDs
    datasets_data = []
    for d in entities.get("datasets", []):
        d_copy = dict(d)
        d_copy["id"] = generate_node_id("dataset", d_copy["label"])
        datasets_data.append(d_copy)

    # Define the Neo4j Transaction
    async def _insert_graph_tx(tx):
        # 1. MERGE Paper Node (Updates properties if it already exists)
        await tx.run("""
            MERGE (p:Paper {id: $paper_id})
            SET p += $metadata,
                p.type = 'paper'
        """, paper_id=paper_id, metadata=paper_metadata)

        # 2. Bulk insert Models & Relationships using UNWIND
        if models_data:
            await tx.run("""
                MATCH (p:Paper {id: $paper_id})
                UNWIND $models AS model
                
                // MERGE ensures we don't create duplicate models if 10 papers use BERT
                MERGE (m:Model {id: model.id})
                
                // The 'coalesce' trick: Only overwrite framework/task if the new paper provides them.
                // Otherwise, keep what we already know about this model.
                SET m.label = model.label,
                    m.type = 'model',
                    m.framework = coalesce(model.framework, m.framework),
                    m.task = coalesce(model.task, m.task),
                    m.paramCount = coalesce(model.paramCount, m.paramCount)
                    
                MERGE (p)-[:USES_MODEL]->(m)
            """, paper_id=paper_id, models=models_data)

        # 3. Bulk insert Datasets & Relationships using UNWIND
        if datasets_data:
            await tx.run("""
                MATCH (p:Paper {id: $paper_id})
                UNWIND $datasets AS dataset
                
                MERGE (d:Dataset {id: dataset.id})
                SET d.label = dataset.label,
                    d.type = 'dataset',
                    d.size = coalesce(dataset.size, d.size),
                    d.task = coalesce(dataset.task, d.task)
                    
                MERGE (p)-[:USES_DATASET]->(d)
            """, paper_id=paper_id, datasets=datasets_data)

    # Execute the write transaction
    async with db.driver.session() as session:
        await session.execute_write(_insert_graph_tx)
async def get_graph_for_papers(paper_ids: list[str]) -> dict:
    if db.driver is None:
        return {"nodes": [], "edges": []}

    query = """
    MATCH (p:Paper) WHERE p.id IN $paper_ids
    OPTIONAL MATCH (p)-[r]->(target)
    RETURN p, r, type(r) AS rel_type, target
    """

    nodes = {}
    edges = []

    async with db.driver.session() as session:
        result = await session.run(query, paper_ids=paper_ids)
        records = await result.data()
        
        for record in records:
            paper_node = record.get("p")
            # 1. Safety check: If for some reason 'p' is missing, skip this record
            if not paper_node:
                continue

            # Add the Paper node
            p_id = paper_node["id"]
            if p_id not in nodes:
                nodes[p_id] = {
                    "id": p_id,
                    "type": paper_node.get("type", "paper"),
                    "label": paper_node.get("title", "Unknown Title"),
                    "metadata": dict(paper_node)
                }

            # 2. Check for existence of target and relationship
            target_node = record.get("target")
            rel_type = record.get("rel_type")

            if target_node and rel_type:
                t_id = target_node["id"]
                
                # Add the Target node if not already seen
                if t_id not in nodes:
                    nodes[t_id] = {
                        "id": t_id,
                        "type": target_node.get("type"),
                        "label": target_node.get("label"),
                        "metadata": dict(target_node)
                    }

                # Add the Edge (Now safe because p_id and t_id are guaranteed)
                edges.append({
                    "id": f"{p_id}-{t_id}",
                    "source": p_id,
                    "target": t_id,
                    "type": rel_type
                })

    return {
        "nodes": list(nodes.values()),
        "edges": edges
    }
