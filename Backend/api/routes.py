from fastapi import APIRouter
from worker.queue import paper_queue
from services.cloud_llm import generate_arxiv_query

# Create a router we will plug into our main app
router = APIRouter()

@router.get("/")
async def root():
    return {"message": "ArXiv Grapher API is running!"}

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
    A temporary endpoint to test our Gemini query translator.
    """
    arxiv_string = await generate_arxiv_query(query)
    return {
        "user_input": query, 
        "arxiv_query": arxiv_string
    }