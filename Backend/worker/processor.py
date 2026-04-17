import asyncio
import re

from worker.queue import paper_queue
from services.core_api import fetch_core_work, resolve_core_id_from_doi
from services.cloud_llm import extract_entities
from core.database import check_if_paper_enriched, save_graph_to_db


def _format_text_for_extraction(core_work: dict) -> str:
    title = (core_work.get("title") or "").strip()
    abstract = (core_work.get("abstract") or "").strip()
    full_text = (core_work.get("fullText") or "").strip()

    if not full_text:
        return ""

    body = re.split(
        r"\n\s*(references|bibliography)\s*:?\s*\n",
        full_text,
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0].strip()

    if not body:
        return ""

    return f"TITLE:\n{title}\n\nABSTRACT:\n{abstract}\n\nBODY:\n{body}"


async def background_worker():
    """
    Continuously listens to the paper_queue, resolves CORE full-text by DOI,
    and enriches indexed papers with Model/Dataset entities.
    """
    print("🤖 Background worker started. Listening for tasks...")
    while True:
        try:
            task = await paper_queue.get()
        except asyncio.CancelledError:
            print("🛑 Background worker gracefully shutting down...")
            break

        paper_id = None
        completion_future = None
        completion_status = "failed"

        try:
            if isinstance(task, dict):
                paper_id = task.get("paper_id")
                doi = task.get("doi")
                paper_metadata = task.get("paper_metadata", {})
                completion_future = task.get("completion_future")
            else:
                paper_id = task
                doi = None
                paper_metadata = {}

            if not paper_id:
                completion_status = "missing_paper_id"
                continue

            print(f"⚙️ Worker picked up paper: {paper_id}")

            is_enriched = await check_if_paper_enriched(paper_id)
            if is_enriched:
                print(f"🟢 Paper {paper_id} already enriched. Skipping.")
                completion_status = "already_enriched"
                continue

            if not doi:
                print(f"⚠️ Missing DOI for {paper_id}; cannot resolve CORE ID.")
                completion_status = "missing_doi"
                continue

            core_id = await resolve_core_id_from_doi(doi)
            if not core_id:
                print(f"⚠️ No CORE ID found for DOI {doi}.")
                completion_status = "core_id_not_found"
                continue

            core_work = await fetch_core_work(core_id)
            if not core_work:
                print(f"⚠️ CORE work lookup failed for ID {core_id}.")
                completion_status = "core_work_not_found"
                continue

            formatted_text = _format_text_for_extraction(core_work)
            if not formatted_text:
                print(f"⚠️ Empty formatted full-text for {paper_id}.")
                completion_status = "empty_formatted_text"
                continue

            entities = await extract_entities(formatted_text)

            print(f"🎯 Extraction Complete for {paper_id}:")
            print(f"   - Models Found: {len(entities.get('models', []))}")
            print(f"   - Datasets Found: {len(entities.get('datasets', []))}")

            await save_graph_to_db(paper_id, entities, paper_metadata=paper_metadata)
            print(f"💾 Successfully saved {paper_id} enrichment to Neo4j!")
            print(f"✅ Finished processing task for: {paper_id}")
            completion_status = "success"
        except Exception as e:
            print(f"⚠️ Error processing paper in queue: {e}")
            completion_status = "error"
        finally:
            if completion_future is not None and not completion_future.done():
                completion_future.set_result(
                    {
                        "paper_id": paper_id,
                        "status": completion_status,
                    }
                )
            paper_queue.task_done()
