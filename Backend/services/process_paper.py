# services/process_paper.py

import asyncio

from core.config import settings
from core.database import check_if_paper_exists, save_graph_to_db
from services.html_parser import fetch_and_parse_ar5iv
from services.cloud_llm import extract_entities


async def process_single_paper(paper_data: dict):
    """Handles the ingestion pipeline for a single paper."""
    paper_id = paper_data["id"]

    # 1. Check DB Cache
    is_indexed = await check_if_paper_exists(paper_id)
    if is_indexed:
        try:
            await asyncio.wait_for(
                save_graph_to_db(paper_id, {"models": [], "datasets": []}, paper_metadata=paper_data),
                timeout=settings.PAPER_DB_TIMEOUT_SECONDS,
            )
            print(f"{paper_id} already in Neo4j. Refreshed metadata and skipped extraction.")
        except TimeoutError:
            print(f"{paper_id} metadata refresh timed out. Continuing with cached graph data.")
        except Exception as exc:
            print(f"{paper_id} metadata refresh failed: {exc}")
        return paper_id

    # 2. Fetch and Extract
    print(f"{paper_id} not in DB. Fetching HTML...")
    try:
        parsed_text = await asyncio.wait_for(
            fetch_and_parse_ar5iv(paper_id=paper_id),
            timeout=settings.PAPER_HTML_TIMEOUT_SECONDS,
        )
    except TimeoutError:
        print(f"{paper_id} HTML fetch timed out.")
        return paper_id
    except Exception as exc:
        print(f"{paper_id} HTML fetch failed: {exc}")
        return paper_id

    if parsed_text:
        print(f"Extracting entities for {paper_id}...")
        try:
            entities = await asyncio.wait_for(
                extract_entities(parsed_text),
                timeout=settings.PAPER_EXTRACTION_TIMEOUT_SECONDS,
            )
        except TimeoutError:
            print(f"{paper_id} entity extraction timed out.")
            entities = {"models": [], "datasets": []}
        except Exception as exc:
            print(f"{paper_id} entity extraction failed: {exc}")
            entities = {"models": [], "datasets": []}

        # 3. Save to DB
        try:
            await asyncio.wait_for(
                save_graph_to_db(paper_id, entities, paper_metadata=paper_data),
                timeout=settings.PAPER_DB_TIMEOUT_SECONDS,
            )
            print(f"Saved {paper_id} to Neo4j!")
        except TimeoutError:
            print(f"{paper_id} database save timed out. Skipping this paper.")
        except Exception as exc:
            print(f"{paper_id} database save failed: {exc}")
    else:
        print(f"Failed to process {paper_id}")

    return paper_id
