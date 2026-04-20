import asyncio

from fastapi import APIRouter

from core.config import settings
from core.database import get_graph_for_papers
from services.arxiv import search_papers
from services.cloud_llm import generate_arxiv_query
from services.process_paper import process_single_paper
from worker.queue import paper_queue

# Create a router we will plug into our main app
router = APIRouter()


async def process_papers_with_limit(papers: list[dict]) -> list:
    semaphore = asyncio.Semaphore(max(settings.PAPER_PROCESS_CONCURRENCY, 1))

    async def _process(paper: dict):
        async with semaphore:
            return await process_single_paper(paper)

    tasks = [_process(paper) for paper in papers]
    return await asyncio.gather(*tasks, return_exceptions=True)


def merge_search_metadata(graph_data: dict, papers: list[dict]) -> dict:
    nodes = list(graph_data.get("nodes", []))
    edges = list(graph_data.get("edges", []))
    nodes_by_id = {node.get("id"): node for node in nodes}

    for paper in papers:
        paper_id = paper["id"]
        existing_node = nodes_by_id.get(paper_id)
        paper_metadata = {**paper}
        paper_metadata.pop("id", None)
        paper_metadata.pop("label", None)

        if existing_node:
            existing_node["type"] = existing_node.get("type", "paper")
            existing_node["label"] = existing_node.get("label") or paper.get("title") or paper_id
            existing_node["metadata"] = {
                **(existing_node.get("metadata") or {}),
                **paper_metadata,
            }
            continue

        new_node = {
            "id": paper_id,
            "type": "paper",
            "label": paper.get("title") or paper_id,
            "metadata": paper_metadata,
        }
        nodes.append(new_node)
        nodes_by_id[paper_id] = new_node

    return {"nodes": nodes, "edges": edges}


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
        "arxiv_query": arxiv_string,
    }


@router.post("/search/")
async def search_and_graph_papers(query: str):
    """
    1. Translates user query
    2. Searches arXiv
    3. Concurrently processes unindexed papers via Gemma
    4. Queries Neo4j for the final graph
    5. Returns exact Frontend JSON
    """
    print(f"Translating user query: '{query}'")
    arxiv_string = await generate_arxiv_query(query)

    print(f"Fetching top papers for: {arxiv_string}")
    papers = await search_papers(arxiv_string, max_results=10)

    target_paper_ids = [p["id"] for p in papers]

    print(f"Starting paper processing with concurrency={settings.PAPER_PROCESS_CONCURRENCY}...")
    task_results = await process_papers_with_limit(papers)
    for paper, result in zip(papers, task_results):
        if isinstance(result, Exception):
            print(f"Paper processing failed for {paper['id']}: {result}")

    print("All papers processed. Fetching final graph from Neo4j...")
    graph_data = await get_graph_for_papers(target_paper_ids)
    graph_data = merge_search_metadata(graph_data, papers)

    return {
        "search_query": arxiv_string,
        "results_found": len(papers),
        "graph": graph_data,
    }
