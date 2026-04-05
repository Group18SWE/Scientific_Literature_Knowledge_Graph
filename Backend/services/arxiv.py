import os
import httpx
import xml.etree.ElementTree as ET

async def search_papers(arxiv_query: str, max_results: int = 3):
    """
    Hits the arXiv API with our translated boolean string and returns paper metadata.
    """
    # Just the base URL without the f-string query
    url = "https://export.arxiv.org/api/query"
    
    # We put our variables into a dictionary
    params = {
        "search_query": arxiv_query,
        "start": 0,
        "max_results": max_results
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Pass the params dictionary to httpx so it safely URL-encodes everything!
            response = await client.get(url, params=params)
            response.raise_for_status()
    except httpx.RequestError as e:
        print(f"⚠️ Network error while contacting arXiv: {e}")
        return []
    except httpx.HTTPStatusError as e:
        print(f"⚠️ Bad response from arXiv: {e}")
        return []

    # Parse XML safely
    try:
        root = ET.fromstring(response.text)
    except ET.ParseError as e:
        print(f"⚠️ Failed to parse XML: {e}")
        return []

    ns = {'atom': 'http://www.w3.org/2005/Atom'}

    papers = []

    for entry in root.findall('atom:entry', ns):
        try:
            # ID extraction
            id_elem = entry.find('atom:id', ns)
            if id_elem is None or id_elem.text is None:
                continue
            paper_id_url = id_elem.text
            paper_id = paper_id_url.split('/abs/')[-1]

            # Title extraction
            title_elem = entry.find('atom:title', ns)
            if title_elem is None or title_elem.text is None:
                title = "No title available"
            else:
                title = title_elem.text.replace('\n', ' ').strip()

            papers.append({
                "id": paper_id,
                "title": title
            })

        except Exception as e:
            print(f"⚠️ Skipping malformed entry: {e}")
            continue

    return papers


async def download_pdf(paper_id: str, save_dir: str = "temp") -> str:
    """
    Downloads the PDF of a paper given its arXiv ID to a local folder.
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
        # UPDATED: Added follow_redirects=True to handle arXiv's URL routing
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