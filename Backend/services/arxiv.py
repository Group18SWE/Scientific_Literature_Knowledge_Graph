import os
import re
import asyncio
import xml.etree.ElementTree as ET

import httpx


def _clean_text(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(value.replace("\n", " ").split()).strip()


def _extract_pdf_url(entry: ET.Element, ns: dict[str, str]) -> str | None:
    for link in entry.findall("atom:link", ns):
        href = link.attrib.get("href")
        title = link.attrib.get("title", "").lower()
        link_type = link.attrib.get("type", "").lower()
        if href and (title == "pdf" or "pdf" in link_type):
            return href
    return None


def _normalize_github_url(url: str) -> str:
    cleaned = url.strip().rstrip(").,;:!?]}>\"'")
    if cleaned.endswith(".git"):
        cleaned = cleaned[:-4]
    return cleaned


def _extract_github_links(html: str) -> list[str]:
    if not html:
        return []

    raw_links = re.findall(r"https?://(?:www\.)?github\.com/[^\s\"'<>]+", html, flags=re.IGNORECASE)
    github_links = []
    seen = set()

    for link in raw_links:
        normalized = _normalize_github_url(link)
        lowered = normalized.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        github_links.append(normalized)

    return github_links


async def _fetch_paper_links(client: httpx.AsyncClient, paper: dict) -> dict:
    paper_url = paper.get("paperUrl")
    if not paper_url:
        return paper

    try:
        response = await client.get(paper_url, follow_redirects=True)
        response.raise_for_status()
        github_links = _extract_github_links(response.text)
        if github_links:
            paper["githubLinks"] = github_links
            paper["githubUrl"] = github_links[0]
    except (httpx.RequestError, httpx.HTTPStatusError) as e:
        print(f"Failed to fetch arXiv abstract page for {paper.get('id')}: {e}")

    return paper


async def search_papers(arxiv_query: str, max_results: int = 3):
    """
    Hits the arXiv API with our translated boolean string and returns paper metadata.
    Includes strict rate-limiting compliance to prevent 429 errors.
    """
    url = "https://export.arxiv.org/api/query"

    params = {
        "search_query": arxiv_query,
        "start": 0,
        "max_results": max_results,
    }

    headers = {
        "User-Agent": "ArXivGrapher_DevBot/1.0 (mailto:your_email@example.com)",
    }

    try:
        print("Waiting 3.1 seconds to comply with arXiv rate limits...")
        await asyncio.sleep(3.1)

        async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
            response = await client.get(url, params=params)

            if response.status_code == 429:
                print("ArXiv rate limit hit. We are temporarily blocked.")
                return []

            response.raise_for_status()

    except httpx.RequestError as e:
        print(f"Network error while contacting arXiv: {e}")
        return []
    except httpx.HTTPStatusError as e:
        print(f"Bad response from arXiv: {e}")
        return []

    try:
        root = ET.fromstring(response.text)
    except ET.ParseError as e:
        print(f"Failed to parse XML: {e}")
        return []

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    papers = []

    for entry in root.findall("atom:entry", ns):
        try:
            id_elem = entry.find("atom:id", ns)
            if id_elem is None or id_elem.text is None:
                continue

            paper_url = id_elem.text.strip()
            paper_id = paper_url.split("/abs/")[-1]

            title_elem = entry.find("atom:title", ns)
            summary_elem = entry.find("atom:summary", ns)
            published_elem = entry.find("atom:published", ns)
            title = _clean_text(title_elem.text if title_elem is not None else None) or "No title available"
            abstract = _clean_text(summary_elem.text if summary_elem is not None else None)
            published = published_elem.text.strip() if published_elem is not None and published_elem.text else None

            authors = []
            for author in entry.findall("atom:author", ns):
                name_elem = author.find("atom:name", ns)
                name = _clean_text(name_elem.text if name_elem is not None else None)
                if name:
                    authors.append({"name": name})

            pdf_url = _extract_pdf_url(entry, ns) or f"https://arxiv.org/pdf/{paper_id}.pdf"

            papers.append(
                {
                    "id": paper_id,
                    "title": title,
                    "label": title,
                    "abstract": abstract,
                    "authors": authors,
                    "publicationDate": published,
                    "year": int(published[:4]) if published else None,
                    "paperUrl": paper_url,
                    "url": paper_url,
                    "arxivId": paper_id,
                    "isOpenAccess": True,
                    "openAccessPdf": {
                        "url": pdf_url,
                        "status": "GREEN",
                        "license": "ARXIV",
                    },
                    "publicationVenue": {"name": "arXiv", "type": "repository"},
                    "venue": "arXiv",
                    "journal": {"name": "ArXiv", "volume": f"abs/{paper_id}"},
                    "publicationTypes": ["Preprint"],
                    "githubLinks": [],
                }
            )
        except Exception as e:
            print(f"Skipping malformed entry: {e}")
            continue

    if not papers:
        return papers

    async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
        papers = await asyncio.gather(*[_fetch_paper_links(client, paper) for paper in papers])

    return papers


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
        with open(filepath, "wb") as f:
            f.write(response.content)
    except Exception as e:
        print(f"Failed to save PDF: {e}")
        return ""

    print(f"Downloaded to {filepath}")
    return filepath
