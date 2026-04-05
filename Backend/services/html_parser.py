import httpx
from bs4 import BeautifulSoup
import logging

# Set up a basic logger for console output
logger = logging.getLogger(__name__)

async def fetch_and_parse_ar5iv(paper_id: str) -> str:
    """
    Fetches the HTML version of an arXiv paper from ar5iv.labs.arxiv.org.
    Strips the HTML tags to return clean text for entity extraction.
    
    Args:
        paper_id (str): The arXiv ID (e.g., '2502.07417v1')
        
    Returns:
        str: Cleaned text content of the paper, or an empty string if it fails.
    """
    logger.info(f"🌐 Fetching ar5iv HTML for {paper_id}...")
    url = f"https://ar5iv.labs.arxiv.org/html/{paper_id}"
    
    try:
        # We use async context manager for non-blocking HTTP requests
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, follow_redirects=True)
            
            # If the paper hasn't been compiled to HTML by arXiv yet, it might return 404
            if response.status_code != 200:
                logger.warning(f"⚠️ ar5iv HTML not found for {paper_id} (Status: {response.status_code})")
                return ""
            
            logger.info("✅ HTML downloaded! Parsing with BeautifulSoup...")
            
            # Parse the HTML using the fast lxml parser
            soup = BeautifulSoup(response.text, "lxml")
            
            # Remove scripts, styles, and potentially massive reference sections to save tokens
            for element in soup(["script", "style"]):
                element.decompose()
                
            # Extract plain text with a newline separator for readability
            text_content = soup.get_text(separator="\n", strip=True)
            
            logger.info(f"📝 Successfully extracted {len(text_content)} characters!")
            return text_content

    except Exception as e:
        logger.error(f"🔴 HTML Extraction failed for {paper_id}: {e}")
        return ""