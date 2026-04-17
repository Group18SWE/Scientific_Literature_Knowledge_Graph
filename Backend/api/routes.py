from fastapi import APIRouter
import asyncio
from worker.queue import paper_queue
from services.openalex import search_papers
from services.cloud_llm import generate_openalex_query
from core.database import get_graph_for_papers, save_graph_to_db

# Create a router we will plug into our main app
router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Scientific Literature Knowledge Graph API is running!"}

@router.post("/test-queue/{paper_id}")
async def add_to_queue(paper_id: str):
    """
    A temporary endpoint to test dropping items into our background queue.
    """
    await paper_queue.put(paper_id)
    return {"message": f"Paper '{paper_id}' added to the queue."}

@router.post("/search/")
async def search_and_graph_papers(query: str):
    """
    1. Searches OpenAlex for fast OA metadata
    2. Saves Paper nodes immediately for frontend rendering
    3. Queues DOI-based enrichment tasks for async background processing
    4. Waits for all queued enrichment tasks for this request to finish
    5. Returns graph data after enrichment pass completes
    """
    print(f"🔎 Generating OpenAlex query for: '{query}'")
    openalex_query = await generate_openalex_query(query)
    if not openalex_query.strip():
        openalex_query = query.strip()
    print(f"📚 Searching OpenAlex for: '{openalex_query}'")
    papers = await search_papers(openalex_query, max_results=10)

    target_paper_ids = [p["id"] for p in papers]
    loop = asyncio.get_running_loop()
    completion_futures: list[asyncio.Future] = []

    queued_count = 0
    for paper in papers:
        await save_graph_to_db(
            paper_id=paper["id"],
            entities={"models": [], "datasets": []},
            paper_metadata=paper.get("metadata", {}),
        )

        doi = paper.get("doi")
        if doi:
            completion_future = loop.create_future()
            completion_futures.append(completion_future)
            await paper_queue.put(
                {
                    "paper_id": paper["id"],
                    "doi": doi,
                    "paper_metadata": paper.get("metadata", {}),
                    "completion_future": completion_future,
                }
            )
            queued_count += 1

    print(f"⚡ Queued {queued_count} papers for asynchronous enrichment.")
    if completion_futures:
        await asyncio.gather(*completion_futures, return_exceptions=True)
        print(f"✅ Completed enrichment processing for {queued_count} queued papers.")

    graph_data = await get_graph_for_papers(target_paper_ids)

    return {
        "search_query": openalex_query,
        "results_found": len(papers),
        "enrichment_queued": queued_count,
        "graph": graph_data
    }
