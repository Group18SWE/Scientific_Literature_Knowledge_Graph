import aiohttp
from core.config import settings

CORE_BASE_URL = "https://api.core.ac.uk/v3"


def _core_headers() -> dict:
    headers = {"Accept": "application/json"}
    if settings.CORE_API_KEY:
        headers["Authorization"] = f"Bearer {settings.CORE_API_KEY}"
    return headers


async def resolve_core_id_from_doi(doi: str) -> str | None:
    if not doi:
        return None

    url = f"{CORE_BASE_URL}/search/works"
    params = {"q": f"doi:{doi}", "limit": 1}

    try:
        timeout = aiohttp.ClientTimeout(total=20.0)
        async with aiohttp.ClientSession(timeout=timeout, headers=_core_headers()) as client:
            async with client.get(url, params=params, allow_redirects=True) as response:
                response.raise_for_status()
                payload = await response.json() if response.content_length != 0 else {}
    except Exception as exc:
        print(f"⚠️ CORE DOI lookup failed for {doi}: {exc}")
        return None

    results = payload.get("results", []) if isinstance(payload, dict) else []
    if not results:
        return None

    core_id = results[0].get("id")
    return str(core_id) if core_id is not None else None


async def fetch_core_work(core_id: str) -> dict | None:
    if not core_id:
        return None

    url = f"{CORE_BASE_URL}/works/{core_id}"
    try:
        timeout = aiohttp.ClientTimeout(total=30.0)
        async with aiohttp.ClientSession(timeout=timeout, headers=_core_headers()) as client:
            async with client.get(url, allow_redirects=True) as response:
                response.raise_for_status()
                return await response.json() if response.content_length != 0 else None
    except Exception as exc:
        print(f"⚠️ CORE work fetch failed for {core_id}: {exc}")
        return None
