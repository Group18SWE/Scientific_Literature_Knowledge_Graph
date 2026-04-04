import asyncio
from worker.queue import paper_queue

async def background_worker():
    """
    Continuously listens to the paper_queue and processes items sequentially.
    """
    print("🤖 Background worker started. Listening for tasks...")
    while True:
        try:
            # Wait until an item is available in the queue
            paper_id = await paper_queue.get()
            print(f"⚙️ Worker picked up paper ID: {paper_id}")
            
            # TODO: Add arXiv download, GLM-OCR, and Gemma extraction here later
            await asyncio.sleep(3) # Simulating heavy processing time
            
            print(f"✅ Finished processing paper ID: {paper_id}")
            
            # Tell the queue this task is fully complete
            paper_queue.task_done()
        except asyncio.CancelledError:
            print("🛑 Background worker gracefully shutting down...")
            break
        except Exception as e:
            print(f"⚠️ Error processing paper {paper_id}: {e}")