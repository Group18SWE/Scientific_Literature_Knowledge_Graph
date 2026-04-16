from fastapi import APIRouter
from worker.queue import paper_queue
from services.openalex import search_papers
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
    4. Returns graph data without waiting on LLM extraction
    """
    print(f"🔎 Searching OpenAlex for query: '{query}'")
    papers = await search_papers(query, max_results=10)

    target_paper_ids = [p["id"] for p in papers]

    queued_count = 0
    for paper in papers:
        await save_graph_to_db(
            paper_id=paper["id"],
            entities={"models": [], "datasets": []},
            paper_metadata=paper.get("metadata", {}),
        )

        doi = paper.get("doi")
        if doi:
            await paper_queue.put(
                {
                    "paper_id": paper["id"],
                    "doi": doi,
                    "paper_metadata": paper.get("metadata", {}),
                }
            )
            queued_count += 1

    print(f"⚡ Queued {queued_count} papers for asynchronous enrichment.")

    graph_data = await get_graph_for_papers(target_paper_ids)

    return {
        "search_query": query,
        "results_found": len(papers),
        "enrichment_queued": queued_count,
        "graph": graph_data
    }
