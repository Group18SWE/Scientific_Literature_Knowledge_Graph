import httpx
import logging
from core.config import settings

logger = logging.getLogger(__name__)
# Heuristic over-fetch factor to still fill max_results after filtering non-arXiv papers.
OVER_FETCH_MULTIPLIER = 4


SEMANTIC_SCHOLAR_FIELDS = [
    "paperId",
    "corpusId",
    "externalIds",
    "url",
    "title",
    "authors",
    "year",
    "publicationDate",
    "venue",
    "publicationVenue",
    "journal",
    "publicationTypes",
    "citationCount",
    "referenceCount",
    "influentialCitationCount",
    "abstract",
    "tldr",
    "fieldsOfStudy",
    "s2FieldsOfStudy",
    "isOpenAccess",
    "openAccessPdf",
]


def _extract_arxiv_id(paper: dict) -> str:
    external_ids = paper.get("externalIds") or {}
    arxiv_id = external_ids.get("ArXiv", "")
    if arxiv_id is None:
        return ""
    return str(arxiv_id).strip()


async def search_papers(search_query: str, max_results: int = 3):
    """
    Hits Semantic Scholar Graph API and returns paper metadata for papers
    that include an arXiv ID (required for ar5iv HTML extraction).
    """
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {
        "query": search_query,
        # We over-fetch because many papers do not include an arXiv ID.
        "limit": max_results * OVER_FETCH_MULTIPLIER,
        "fields": ",".join(SEMANTIC_SCHOLAR_FIELDS),
    }
    headers = {
        "User-Agent": "ScientificLiteratureKG/1.0"
    }
    if settings.SEMANTIC_SCHOLAR_API_KEY:
        headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_API_KEY

    try:
        async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
    except httpx.RequestError as e:
        logger.warning(f"⚠️ Network error while contacting Semantic Scholar: {e}")
        return []
    except httpx.HTTPStatusError as e:
        logger.warning(f"⚠️ Bad response from Semantic Scholar: {e}")
        return []

    try:
        payload = response.json()
    except ValueError as e:
        logger.warning(f"⚠️ Failed to parse Semantic Scholar response JSON: {e}")
        return []

    papers = []
    seen_arxiv_ids = set()
    for entry in payload.get("data", []):
        arxiv_id = _extract_arxiv_id(entry)
        if not arxiv_id or arxiv_id in seen_arxiv_ids:
            continue

        seen_arxiv_ids.add(arxiv_id)

        paper = dict(entry)
        # `id` is used as the graph node key and for ar5iv fetching, while
        # `arxivId` preserves frontend-compatible Semantic Scholar metadata.
        paper["id"] = arxiv_id
        paper["arxivId"] = arxiv_id
        paper["semanticScholarId"] = entry.get("paperId")
        paper["title"] = entry.get("title") or "No title available"

        papers.append(paper)
        if len(papers) >= max_results:
            break

    return papers
