import asyncio
from fastapi import APIRouter
from worker.queue import paper_queue
from services.semantic_scholar import search_papers
from services.process_paper import process_single_paper
from core.database import get_graph_for_papers

# Create a router we will plug into our main app
router = APIRouter()

@router.get("/")
async def root():
    return {"message": "Scientific Literature Grapher API is running!"}

@router.post("/test-queue/{paper_id}")
async def add_to_queue(paper_id: str):
    """
    A temporary endpoint to test dropping items into our background queue.
    """
    await paper_queue.put(paper_id)
    return {"message": f"Paper '{paper_id}' added to the queue."}

@router.post("/test-translate/")
async def test_translation(query: str):
    """
    A temporary endpoint to inspect the search query passed to Semantic Scholar.
    """
    return {
        "user_input": query, 
        "semantic_scholar_query": query
    }

@router.post("/search/")
async def search_and_graph_papers(query: str):
    """
    1. Searches Semantic Scholar
    2. Keeps only papers with arXiv IDs (for ar5iv extraction)
    3. Concurrently processes unindexed papers via Gemma
    4. Queries Neo4j for the final graph
    5. Returns exact Frontend JSON
    """
    print(f"📚 Fetching top papers from Semantic Scholar for: {query}")
    papers = await search_papers(query, max_results=10)
    
    # Extract IDs for our final query
    target_paper_ids = [p["id"] for p in papers]
    
    print("⚡ Starting concurrent paper processing...")
    # asyncio.gather runs all 3 paper pipelines at the EXACT SAME TIME
    # This keeps your API response time as low as possible.
    tasks = [process_single_paper(paper) for paper in papers]
    await asyncio.gather(*tasks)
    
    print("📊 All papers processed! Fetching final graph from Neo4j...")
    
    # 5. Query Neo4j for the JSON the frontend wants
    graph_data = await get_graph_for_papers(target_paper_ids)
    
    return {
        "search_query": query,
        "results_found": len(papers),
        "graph": graph_data  # <--- Here is the exact {nodes: [], edges: []} for React!
    }

