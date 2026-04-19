import httpx
from core.config import settings
import json
from pathlib import Path

CORE_SEARCH_URL = "https://api.core.ac.uk/v3/search/works"

def _save_json_local(data: dict, filename: str = "core_records.json"):
    file_path = Path(__file__).parent / filename

    try:
        # If file exists, append to existing list
        if file_path.exists():
            with open(file_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
            if not isinstance(existing, list):
                existing = []
        else:
            existing = []

        existing.append(data)

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2, ensure_ascii=False)

    except Exception as e:
        print(f"⚠️ Failed to save JSON: {e}")

def _get_core_headers() -> dict:
    headers = {"Accept": "application/json"}
    if settings.CORE_API_KEY:
        headers["Authorization"] = f"Bearer {settings.CORE_API_KEY}"
    return headers

import re

def _slugify(text: str):
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')


def _normalize_core_record(raw: dict) -> dict:
    source = raw.get("_source", raw)

    # --- ID fallback ---
    paper_id = source.get("id") or source.get("coreId") or raw.get("id")

    # --- Basic fields ---
    title = source.get("title") or "No title available"
    abstract = source.get("abstract")

    # --- Authors ---
    authors = []
    for a in source.get("authors") or []:
        name = a.get("name", "").strip()

        # Convert "Last, First" → "First Last"
        if "," in name:
            last, first = name.split(",", 1)
            name = f"{first.strip()} {last.strip()}"

        authors.append({
            "id": f"author_{_slugify(name)}",
            "name": name
        })

    # --- Identifiers ---
    identifiers = source.get("identifiers") or []
    external_ids = {}
    for item in identifiers:
        t = item.get("type")
        v = item.get("identifier")

        if t == "DOI":
            external_ids["doi"] = v
        elif t == "ARXIV_ID":
            external_ids["arxivId"] = v
        elif t == "CORE_ID":
            external_ids["coreId"] = v

    # --- URLs ---
    download_url = source.get("downloadUrl")
    fulltext_urls = source.get("sourceFulltextUrls") or source.get("fullTextIdentifiers") or []

    pdf_url = None
    if download_url and "arxiv.org/abs/" in download_url:
        pdf_url = download_url.replace("/abs/", "/pdf/")
    else:
        pdf_url = download_url

    year_published = source.get("yearPublished")
    published_date = source.get("publishedDate")
    if year_published is None and isinstance(published_date, str) and len(published_date) >= 4:
        try:
            year_published = int(published_date[:4])
        except ValueError:
            year_published = None

    fields_of_study = source.get("fieldsOfStudy")
    if not fields_of_study:
        single_field = source.get("fieldOfStudy")
        fields_of_study = [single_field] if single_field else []
    elif isinstance(fields_of_study, str):
        fields_of_study = [fields_of_study]

    journals = source.get("journals") or []
    journal_title = None
    if journals and isinstance(journals[0], dict):
        journal_title = journals[0].get("title")

    publication_venue_name = (
        source.get("publisher")
        or journal_title
        or "Unknown Venue"
    )
    publication_venue = {"name": publication_venue_name, "type": source.get("documentType")}

    references = source.get("references") or []

    return {
        "id": str(paper_id) if paper_id is not None else "",

        "title": title,
        "abstract": abstract,

        "authors": authors,

        "year": year_published,
        "publicationDate": published_date,

        "doi": source.get("doi") or external_ids.get("doi"),

        "citationCount": source.get("citationCount") or 0,
        "influentialCitationCount": source.get("influentialCitationCount") or 0,
        "referenceCount": len(references),

        "venue": publication_venue_name,
        "publicationVenue": publication_venue,

        "publicationTypes": [source.get("documentType")] if source.get("documentType") else [],

        "fieldsOfStudy": fields_of_study,

        "isOpenAccess": bool(download_url or fulltext_urls),
        "openAccessPdf": {"url": pdf_url} if pdf_url else None,

        "externalIds": external_ids,
        "arxivId": source.get("arxivId") or external_ids.get("arxivId"),
        "pubmedId": source.get("pubmedId"),
        "magId": source.get("magId"),
        "oaiIds": source.get("oaiIds") or [],

        "downloadUrl": download_url,
        "pdfUrl": pdf_url,
        "sourceFulltextUrls": fulltext_urls,

        # Extra CORE metadata (nested values will be serialized before Neo4j write)
        "acceptedDate": source.get("acceptedDate"),
        "createdDate": source.get("createdDate"),
        "depositedDate": source.get("depositedDate"),
        "updatedDate": source.get("updatedDate"),
        "documentType": source.get("documentType"),
        "language": source.get("language"),
        "identifiers": source.get("identifiers") or [],
        "contributors": source.get("contributors") or [],
        "outputs": source.get("outputs") or [],
        "dataProviders": source.get("dataProviders") or [],
        "journals": journals,
        "links": source.get("links") or [],
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
        async with httpx.AsyncClient(timeout=20.0, headers=headers, follow_redirects=True) as client:
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

    # Expected CORE v3 structure is {"results": [...]}; keep additional defensive fallbacks
    # for integrations/proxies that can wrap the same record list under "data" or "hits.hits".
    records = payload.get("results")
    if records is None and isinstance(payload.get("data"), list):
        records = payload.get("data")
    if records is None and isinstance(payload.get("hits"), dict):
        records = payload.get("hits", {}).get("hits")
    if not isinstance(records, list):
        return []

    papers = []
    for record in records:
        _save_json_local(record)
        try:
            normalized = _normalize_core_record(record)
            if not normalized["id"]:
                continue
            papers.append(normalized)
        except Exception as e:
            print(f"⚠️ Skipping malformed entry: {e}")
            continue

    return papers

async def search_papers(query: str, max_results: int = 3):
    """
    Deprecated backward-compatible alias. Use search_core_papers instead.
    """
    return await search_core_papers(query, max_results=max_results)


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
