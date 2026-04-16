import httpx
from core.config import settings

OPENALEX_WORKS_URL = "https://api.openalex.org/works"


def _reconstruct_abstract(abstract_inverted_index: dict | None) -> str:
    if not abstract_inverted_index:
        return ""

    positions_to_tokens: dict[int, str] = {}
    for token, positions in abstract_inverted_index.items():
        for position in positions:
            positions_to_tokens[position] = token

    if not positions_to_tokens:
        return ""

    max_position = max(positions_to_tokens)
    return " ".join(positions_to_tokens.get(i, "") for i in range(max_position + 1)).strip()


def _normalize_doi(doi: str | None) -> str | None:
    if not doi:
        return None
    return doi.replace("https://doi.org/", "").replace("http://doi.org/", "").strip().lower() or None


def _paper_id_from_openalex(work: dict) -> str:
    doi = _normalize_doi(work.get("doi"))
    if doi:
        return f"doi:{doi}"

    openalex_id = str(work.get("id", "")).rstrip("/")
    suffix = openalex_id.split("/")[-1] if openalex_id else "unknown"
    return f"openalex:{suffix}"


async def search_papers(query: str, max_results: int = 10) -> list[dict]:
    """
    Uses OpenAlex to retrieve open-access paper metadata quickly.
    """
    params = {
        "search": query,
        "per-page": max_results,
        "filter": "is_oa:true",
        "sort": "relevance_score:desc",
    }

    headers = {}
    if settings.OPENALEX_MAILTO:
        headers["User-Agent"] = f"ScientificLiteratureKG/1.0 (mailto:{settings.OPENALEX_MAILTO})"

    try:
        async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
            response = await client.get(OPENALEX_WORKS_URL, params=params)
            response.raise_for_status()
    except Exception as exc:
        print(f"⚠️ OpenAlex request failed: {exc}")
        return []

    payload = response.json()
    results = payload.get("results", []) if isinstance(payload, dict) else []

    papers: list[dict] = []
    for work in results:
        doi = _normalize_doi(work.get("doi"))
        paper_id = _paper_id_from_openalex(work)

        title = work.get("title") or "Untitled"
        abstract = _reconstruct_abstract(work.get("abstract_inverted_index"))

        author_names = []
        for authorship in work.get("authorships", []) or []:
            author = authorship.get("author", {})
            name = author.get("display_name")
            if name:
                author_names.append(name)

        open_access = work.get("open_access") or {}

        metadata = {
            "id": paper_id,
            "type": "paper",
            "title": title,
            "authors": author_names,
            "year": work.get("publication_year"),
            "publicationDate": work.get("publication_date"),
            "abstract": abstract,
            "citationCount": work.get("cited_by_count"),
            "isOpenAccess": open_access.get("is_oa"),
            "doi": doi,
            "openalexId": work.get("id"),
            "venue": (work.get("primary_location") or {}).get("source", {}).get("display_name"),
            "openAccessPdf": {
                "url": open_access.get("oa_url"),
                "status": "OPEN" if open_access.get("is_oa") else "CLOSED",
            } if open_access.get("oa_url") else None,
        }

        papers.append({
            "id": paper_id,
            "doi": doi,
            "title": title,
            "metadata": metadata,
        })

    return papers
