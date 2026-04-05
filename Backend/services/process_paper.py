# services/process_paper.py

from core.database import check_if_paper_exists, save_graph_to_db
from services.html_parser import fetch_and_parse_ar5iv
from services.cloud_llm import extract_entities

async def process_single_paper(paper_data: dict):
    """Handles the ingestion pipeline for a single paper."""
    paper_id = paper_data["id"]
    
    # 1. Check DB Cache
    is_indexed = await check_if_paper_exists(paper_id)
    if is_indexed:
        print(f"🟢 {paper_id} already in Neo4j. Skipping extraction.")
        return paper_id 
        
    # 2. Fetch and Extract
    print(f"🟡 {paper_id} not in DB. Fetching HTML...")
    parsed_text = await fetch_and_parse_ar5iv(paper_id=paper_id)
    
    if parsed_text:
        print(f"📝 Extracting entities for {paper_id}...")
        entities = await extract_entities(parsed_text)
        
        # 3. Save to DB
        await save_graph_to_db(paper_id, entities, paper_metadata=paper_data)
        print(f"💾 Saved {paper_id} to Neo4j!")
    else:
        print(f"⚠️ Failed to process {paper_id}")
        
    return paper_id