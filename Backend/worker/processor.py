import asyncio
from worker.queue import paper_queue
from services.html_parser import fetch_and_parse_ar5iv
from services.cloud_llm import extract_entities

# We will create these database functions in the next step!
from core.database import check_if_paper_exists, save_graph_to_db

async def background_worker():
    """
    Continuously listens to the paper_queue, checks the DB cache, 
    and processes unindexed papers concurrently.
    """
    print("Background worker started. Listening for tasks...")
    while True:
        try:
            # 1. Wait until an item is available in the queue
            # Note: Right now your queue passes a simple 'paper_id' string. 
            # We may update this later to pass a dictionary containing the arXiv metadata too!
            paper_id = await paper_queue.get()
            print(f"Worker picked up paper ID: {paper_id}")
            
            # 2. Check if the paper is already in our Neo4j database
            is_indexed = await check_if_paper_exists(paper_id)
            
            if is_indexed:
                print(f"Paper {paper_id} is already in Neo4j. Skipping extraction!")
                paper_queue.task_done()
                continue  # Skip the rest of the loop and grab the next paper
            
            # 3. Paper is NOT in DB. Fetch the HTML text.
            print(f"Paper {paper_id} not found in DB. Fetching...")
            parsed_text = await fetch_and_parse_ar5iv(paper_id=paper_id)
            
            if parsed_text:
                print(f"Extracted {len(parsed_text)} characters. Starting Entity Extraction...")
                
                # 4. Extract ML Models and Datasets using GenAI
                entities = await extract_entities(parsed_text)
                
                print(f"Extraction Complete for {paper_id}:")
                print(f"   - Models Found: {len(entities.get('models', []))}")
                print(f"   - Datasets Found: {len(entities.get('datasets', []))}")
                
                # 5. Save the final graph (Paper + Models + Datasets) to Neo4j
                await save_graph_to_db(paper_id, entities)
                print(f"Successfully saved {paper_id} graph to Neo4j!")
                
            else:
                print(f"Failed to extract HTML text for paper {paper_id}. Skipping.")
            
            print(f"Finished processing task for: {paper_id}")
            
            # 6. Tell the queue this task is fully complete
            paper_queue.task_done()
            
        except asyncio.CancelledError:
            print("Background worker gracefully shutting down...")
            break
        except Exception as e:
            print(f"Error processing paper in queue: {e}")