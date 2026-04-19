import httpx
from core.config import settings

CORE_SEARCH_URL = "https://api.core.ac.uk/v3/search/works"

def _get_core_headers() -> dict:
    headers = {"Accept": "application/json"}
    if settings.CORE_API_KEY:
        headers["Authorization"] = f"Bearer {settings.CORE_API_KEY}"
    return headers

def _normalize_core_record(raw: dict) -> dict:
    source = raw.get("_source", raw)
    paper_id = source.get("id") or source.get("coreId") or raw.get("id")
    title = source.get("title") or "No title available"
    return {
        "id": str(paper_id) if paper_id is not None else "",
        "title": title,
        "doi": source.get("doi"),
        "abstract": source.get("abstract"),
        "downloadUrl": source.get("downloadUrl"),
        "sourceFulltextUrls": source.get("sourceFulltextUrls") or source.get("fullTextIdentifiers") or []
    }

async def search_core_papers(core_query: str, max_results: int = 3):
    """
    Hits the CORE API with the translated query and returns normalized paper metadata.
    """
    url = CORE_SEARCH_URL
    
    params = {
        "q": core_query,
        "offset": 0,
        "limit": max_results
    }

    headers = _get_core_headers()

    try:
        async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            
    except httpx.RequestError as e:
        print(f"⚠️ Network error while contacting CORE: {e}")
        return []
    except httpx.HTTPStatusError as e:
        print(f"⚠️ Bad response from CORE: {e}")
        return []

    try:
        payload = response.json()
    except ValueError as e:
        print(f"⚠️ Failed to parse CORE response JSON: {e}")
        return []

    # Expected CORE v3 structure is {"results": [...]}; keep additional fallbacks for
    # deployment/endpoint variance where records may be returned under "data" or "hits.hits".
    records = payload.get("results")
    if records is None and isinstance(payload.get("data"), list):
        records = payload.get("data")
    if records is None and isinstance(payload.get("hits"), dict):
        records = payload.get("hits", {}).get("hits")
    if not isinstance(records, list):
        return []

    papers = []
    for record in records:
        try:
            normalized = _normalize_core_record(record)
            if not normalized["id"]:
                continue
            papers.append(normalized)
        except Exception as e:
            print(f"⚠️ Skipping malformed entry: {e}")
            continue

    return papers

async def search_papers(arxiv_query: str, max_results: int = 3):
    """
    Backward-compatible alias.
    """
    return await search_core_papers(arxiv_query, max_results=max_results)


# ---------------------------------------------------------
# LEGACY / UTILITY FUNCTION (Not actively used in main pipeline)
# ---------------------------------------------------------
async def download_pdf(paper_id: str, save_dir: str = "temp") -> str:
    """
    Downloads the PDF of a paper given its arXiv ID to a local folder.
    (Currently bypassed in favor of HTML extraction via ar5iv)
    """
    try:
        os.makedirs(save_dir, exist_ok=True)
    except Exception as e:
        print(f"⚠️ Failed to create directory: {e}")
        return ""

    pdf_url = f"https://arxiv.org/pdf/{paper_id}.pdf"
    filepath = os.path.join(save_dir, f"{paper_id}.pdf")

    print(f"📥 Downloading PDF for {paper_id}...")

    try:
        # Added follow_redirects=True to handle arXiv's URL routing
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            response = await client.get(pdf_url)
            response.raise_for_status()
            
    except httpx.RequestError as e:
        print(f"⚠️ Network error while downloading PDF: {e}")
        return ""
    except httpx.HTTPStatusError as e:
        print(f"⚠️ Failed to download PDF (bad status): {e}")
        return ""

    try:
        with open(filepath, 'wb') as f:
            f.write(response.content)
    except Exception as e:
        print(f"⚠️ Failed to save PDF: {e}")
        return ""

    print(f"✅ Downloaded to {filepath}")
    return filepath
