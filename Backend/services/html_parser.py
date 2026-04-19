import httpx
from bs4 import BeautifulSoup
import logging
from core.config import settings

# Set up a basic logger for console output
logger = logging.getLogger(__name__)

CORE_WORKS_URL = "https://api.core.ac.uk/v3/works"

def _get_core_headers() -> dict:
    headers = {"Accept": "application/json"}
    if settings.CORE_API_KEY:
        headers["Authorization"] = f"Bearer {settings.CORE_API_KEY}"
    return headers

def _extract_text_from_core_record(record: dict) -> str:
    candidate_fields = [
        "fullTextXml",
        "xml",
        "fullText",
        "fulltext",
        "description",
        "abstract",
    ]
    for field in candidate_fields:
        value = record.get(field)
        if isinstance(value, str) and value.strip():
            parsed = BeautifulSoup(value, "lxml")
            text_content = parsed.get_text(separator="\n", strip=True)
            if text_content:
                return text_content
    return ""

async def fetch_and_parse_core_xml(paper_data: dict) -> str:
    """
    Fetches the paper record from CORE and extracts XML/text content for entity extraction.
    
    Args:
        paper_data (dict): CORE paper metadata containing at least an "id" field.
        
    Returns:
        str: Cleaned text content of the paper, or an empty string if it fails.
    """
    paper_id = str(paper_data.get("id", "")).strip()
    if not paper_id:
        return ""

    logger.info(f"🌐 Fetching CORE XML/text for {paper_id}...")
    url = f"{CORE_WORKS_URL}/{paper_id}"
    
    try:
        async with httpx.AsyncClient(timeout=20.0, headers=_get_core_headers()) as client:
            response = await client.get(url, follow_redirects=True)
            
            if response.status_code != 200:
                logger.warning(f"⚠️ CORE full record fetch failed for {paper_id} (Status: {response.status_code})")
                core_text = _extract_text_from_core_record(paper_data)
                if core_text:
                    return core_text
                return str(paper_data.get("abstract", "")).strip()
            
            payload = response.json()
            logger.info("✅ CORE record downloaded! Parsing XML/text...")
            
            text_content = _extract_text_from_core_record(payload)
            if not text_content:
                text_content = _extract_text_from_core_record(paper_data)
            if not text_content:
                text_content = str(payload.get("abstract", "")).strip() or str(paper_data.get("abstract", "")).strip()
            
            logger.info(f"📝 Successfully extracted {len(text_content)} characters!")
            return text_content

    except Exception as e:
        logger.error(f"🔴 CORE XML/text extraction failed for {paper_id}: {e}")
        return ""

async def fetch_and_parse_ar5iv(paper_id: str) -> str:
    """
    Backward-compatible alias.
    """
    return await fetch_and_parse_core_xml({"id": paper_id})
