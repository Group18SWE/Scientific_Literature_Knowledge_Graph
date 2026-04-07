import os
import httpx
import xml.etree.ElementTree as ET
import asyncio

async def search_papers(arxiv_query: str, max_results: int = 3):
    """
    Hits the arXiv API with our translated boolean string and returns paper metadata.
    Includes strict rate-limiting compliance to prevent 429 errors.
    """
    url = "https://export.arxiv.org/api/query"
    
    params = {
        "search_query": arxiv_query,
        "start": 0,
        "max_results": max_results
    }

    # 1. Be polite: ArXiv demands custom User-Agents!
    headers = {
        "User-Agent": "ArXivGrapher_DevBot/1.0 (mailto:saketishaan123@gmail.com)"
    }

    try:
        # 2. Force a safety delay to prevent React Strict Mode double-fetches from triggering a 429
        print("Waiting 3.1 seconds to comply with arXiv rate limits...")
        await asyncio.sleep(3.1)
        
        # 3. Pass the headers into the httpx client
        async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
            response = await client.get(url, params=params)
            
            # If we STILL get a 429, catch it gracefully without crashing
            if response.status_code == 429:
                print("ArXiv rate limit hit! We are temporarily blocked.")
                return []
                
            response.raise_for_status()
            
    except httpx.RequestError as e:
        print(f"Network error while contacting arXiv: {e}")
        return []
    except httpx.HTTPStatusError as e:
        print(f"Bad response from arXiv: {e}")
        return []

    # Parse XML safely
    try:
        root = ET.fromstring(response.text)
    except ET.ParseError as e:
        print(f"Failed to parse XML: {e}")
        return []

    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    papers = []

    for entry in root.findall('atom:entry', ns):
        try:
            id_elem = entry.find('atom:id', ns)
            if id_elem is None or id_elem.text is None:
                continue
            paper_id = id_elem.text.split('/abs/')[-1]

            title_elem = entry.find('atom:title', ns)
            title = title_elem.text.replace('\n', ' ').strip() if title_elem is not None and title_elem.text else "No title available"

            papers.append({
                "id": paper_id,
                "title": title
            })
        except Exception as e:
            print(f"Skipping malformed entry: {e}")
            continue

    return papers


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
        print(f"Failed to create directory: {e}")
        return ""

    pdf_url = f"https://arxiv.org/pdf/{paper_id}.pdf"
    filepath = os.path.join(save_dir, f"{paper_id}.pdf")

    print(f"Downloading PDF for {paper_id}...")

    try:
        # Added follow_redirects=True to handle arXiv's URL routing
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            response = await client.get(pdf_url)
            response.raise_for_status()
            
    except httpx.RequestError as e:
        print(f"Network error while downloading PDF: {e}")
        return ""
    except httpx.HTTPStatusError as e:
        print(f"Failed to download PDF (bad status): {e}")
        return ""

    try:
        with open(filepath, 'wb') as f:
            f.write(response.content)
    except Exception as e:
        print(f"Failed to save PDF: {e}")
        return ""

    print(f"Downloaded to {filepath}")
    return filepath