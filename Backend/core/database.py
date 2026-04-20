import re
import logging
from typing import Any, Optional

from neo4j import AsyncGraphDatabase

from core.config import settings

logger = logging.getLogger(__name__)


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
            self.driver = AsyncGraphDatabase.driver(uri, auth=auth)

            await self.driver.verify_connectivity()
            print("Successfully connected to Neo4j AuraDB!")
        except Exception as e:
            print(f"Failed to connect to Neo4j: {e}")

    async def close(self):
        if self.driver is not None:
            await self.driver.close()
            print("Neo4j connection closed.")


db = Neo4jConnection()


def generate_node_id(prefix: str, label: str) -> str:
    """
    Creates stable, unique IDs for the frontend (e.g., 'model_resnet_50').
    Strips special characters and replaces spaces with underscores.
    """
    clean_label = re.sub(r"[^a-zA-Z0-9\s]", "", label).strip().lower()
    clean_label = re.sub(r"\s+", "_", clean_label)
    return f"{prefix}_{clean_label}"


def _normalize_authors(authors: list[Any] | None) -> list[dict[str, Any]]:
    normalized_authors = []

    for author in authors or []:
        if isinstance(author, dict):
            name = str(author.get("name") or "").strip()
            author_id = author.get("authorId")
        else:
            name = str(author).strip()
            author_id = None

        if not name:
            continue

        normalized_authors.append(
            {
                "id": author_id or generate_node_id("author", name),
                "name": name,
                "label": name,
                "type": "author",
                "authorId": author_id,
            }
        )

    return normalized_authors


def _is_neo4j_primitive(value: Any) -> bool:
    return isinstance(value, (str, int, float, bool)) or value is None


def _sanitize_list_for_neo4j(values: list[Any]) -> list[Any]:
    sanitized = []
    for value in values:
        if _is_neo4j_primitive(value):
            sanitized.append(value)
        elif isinstance(value, dict):
            name = value.get("name")
            if _is_neo4j_primitive(name) and name is not None:
                sanitized.append(name)
        elif isinstance(value, list):
            nested = _sanitize_list_for_neo4j(value)
            if nested:
                sanitized.extend(nested)
        else:
            sanitized.append(str(value))
    return sanitized


def _sanitize_metadata_for_neo4j(metadata: dict[str, Any]) -> dict[str, Any]:
    sanitized: dict[str, Any] = {}

    for key, value in metadata.items():
        if _is_neo4j_primitive(value):
            sanitized[key] = value
            continue

        if isinstance(value, list):
            sanitized_list = _sanitize_list_for_neo4j(value)
            if sanitized_list:
                sanitized[key] = sanitized_list
            continue

        if isinstance(value, dict):
            if key == "openAccessPdf":
                pdf_url = value.get("url")
                if _is_neo4j_primitive(pdf_url) and pdf_url is not None:
                    sanitized["openAccessPdfUrl"] = pdf_url
                continue

            if key == "journal":
                journal_name = value.get("name")
                journal_volume = value.get("volume")
                if _is_neo4j_primitive(journal_name) and journal_name is not None:
                    sanitized["journalName"] = journal_name
                if _is_neo4j_primitive(journal_volume) and journal_volume is not None:
                    sanitized["journalVolume"] = journal_volume
                continue

            if key == "publicationVenue":
                venue_name = value.get("name")
                venue_type = value.get("type")
                if _is_neo4j_primitive(venue_name) and venue_name is not None:
                    sanitized["publicationVenueName"] = venue_name
                if _is_neo4j_primitive(venue_type) and venue_type is not None:
                    sanitized["publicationVenueType"] = venue_type
                continue

            if key == "tldr":
                tldr_text = value.get("text")
                if _is_neo4j_primitive(tldr_text) and tldr_text is not None:
                    sanitized["tldrText"] = tldr_text
                continue

            continue

        sanitized[key] = str(value)

    return sanitized


def _normalize_relationship_type(rel: Any) -> str:
    raw_type = getattr(rel, "type", None)
    if callable(raw_type):
        raw_type = raw_type()
    if not raw_type:
        raw_type = str(rel)

    rel_type = str(raw_type).upper()
    mapping = {
        "USES_MODEL": "uses_model",
        "USES_DATASET": "uses_dataset",
        "WRITTEN_BY": "written_by",
        "CITES": "cites",
    }
    return mapping.get(rel_type, rel_type.lower() if rel_type else "connected_to")


async def check_if_paper_exists(paper_id: str) -> bool:
    """
    Queries Neo4j to see if a Paper node with this ID is already indexed.
    """
    if db.driver is None:
        return False

    query = "MATCH (p:Paper {id: $paper_id}) RETURN p.id LIMIT 1"

    async with db.driver.session() as session:
        result = await session.run(query, paper_id=paper_id)
        record = await result.single()
        return record is not None


async def save_graph_to_db(paper_id: str, entities: dict[str, Any], paper_metadata: Optional[dict[str, Any]] = None):
    """
    Takes the extracted paper graph and writes it into Neo4j using MERGE to avoid duplicates.
    """
    if db.driver is None:
        print("Database not connected!")
        return

    if paper_metadata is None:
        paper_metadata = {}

    db_ready_metadata = _sanitize_metadata_for_neo4j(paper_metadata)

    models_data = []
    for model in entities.get("models", []):
        model_copy = dict(model)
        label = str(model_copy.get("label") or "").strip()
        if not label:
            continue
        model_copy["id"] = generate_node_id("model", label)
        models_data.append(model_copy)

    datasets_data = []
    for dataset in entities.get("datasets", []):
        dataset_copy = dict(dataset)
        label = str(dataset_copy.get("label") or "").strip()
        if not label:
            continue
        dataset_copy["id"] = generate_node_id("dataset", label)
        datasets_data.append(dataset_copy)

    authors_data = _normalize_authors(paper_metadata.get("authors"))

    async def _insert_graph_tx(tx):
        await tx.run(
            """
            MERGE (p:Paper {id: $paper_id})
            SET p += $metadata,
                p.type = 'paper'
            """,
            paper_id=paper_id,
            metadata=db_ready_metadata,
        )

        if models_data:
            await tx.run(
                """
                MATCH (p:Paper {id: $paper_id})
                UNWIND $models AS model

                MERGE (m:Model {id: model.id})
                SET m.label = model.label,
                    m.type = 'model',
                    m.framework = coalesce(model.framework, m.framework),
                    m.task = coalesce(model.task, m.task),
                    m.paramCount = coalesce(model.paramCount, m.paramCount)

                MERGE (p)-[:USES_MODEL]->(m)
                """,
                paper_id=paper_id,
                models=models_data,
            )

        if datasets_data:
            await tx.run(
                """
                MATCH (p:Paper {id: $paper_id})
                UNWIND $datasets AS dataset

                MERGE (d:Dataset {id: dataset.id})
                SET d.label = dataset.label,
                    d.type = 'dataset',
                    d.size = coalesce(dataset.size, d.size),
                    d.task = coalesce(dataset.task, d.task)

                MERGE (p)-[:USES_DATASET]->(d)
                """,
                paper_id=paper_id,
                datasets=datasets_data,
            )

        if authors_data:
            await tx.run(
                """
                MATCH (p:Paper {id: $paper_id})
                UNWIND $authors AS author

                MERGE (a:Author {id: author.id})
                SET a.label = author.label,
                    a.name = author.name,
                    a.type = 'author',
                    a.authorId = coalesce(author.authorId, a.authorId)

                MERGE (p)-[:WRITTEN_BY]->(a)
                """,
                paper_id=paper_id,
                authors=authors_data,
            )

    async with db.driver.session() as session:
        await session.execute_write(_insert_graph_tx)


async def get_graph_for_papers(paper_ids: list[str]) -> dict:
    if db.driver is None:
        logger.warning("Neo4j driver not initialized")
        return {"nodes": [], "edges": []}

    query = """
    MATCH (p:Paper) WHERE p.id IN $paper_ids
    OPTIONAL MATCH (p)-[r]->(target)
    RETURN p, r, target
    """

    nodes = {}
    edges = []
    seen_edge_ids = set()

    try:
        print(f"Fetching graph for {len(paper_ids)} papers")

        async with db.driver.session() as session:
            result = await session.run(query, paper_ids=paper_ids)
            records = await result.data()

        print(f"Retrieved {len(records)} records from Neo4j")

        for record in records:
            try:
                paper_node = record.get("p")

                if not paper_node:
                    print("Missing paper node in record")
                    continue

                p_id = paper_node["id"]

                if p_id not in nodes:
                    nodes[p_id] = {
                        "id": p_id,
                        "type": paper_node.get("type", "paper"),
                        "label": paper_node.get("title", "Unknown Title"),
                        "metadata": dict(paper_node),
                    }

                target_node = record.get("target")
                rel = record.get("r")

                if target_node and rel:
                    t_id = target_node["id"]

                    if t_id not in nodes:
                        nodes[t_id] = {
                            "id": t_id,
                            "type": target_node.get("type"),
                            "label": target_node.get("label") or target_node.get("name") or "Unknown",
                            "metadata": dict(target_node),
                        }

                    rel_type = _normalize_relationship_type(rel)
                    edge_id = f"{p_id}-{rel_type}-{t_id}"
                    if edge_id in seen_edge_ids:
                        continue

                    seen_edge_ids.add(edge_id)
                    edges.append(
                        {
                            "id": edge_id,
                            "source": p_id,
                            "target": t_id,
                            "type": rel_type,
                        }
                    )

            except Exception as record_error:
                logger.error(f"Error processing record: {record_error}", exc_info=True)

        print(f"Graph built: {len(nodes)} nodes, {len(edges)} edges")

    except Exception as e:
        logger.error(f"Neo4j query failed: {e}", exc_info=True)
        return {"nodes": [], "edges": []}

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
    }
