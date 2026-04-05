import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from core.database import db
from worker.processor import background_worker
from api.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages the startup and shutdown sequence of our API."""
    print("🚀 Starting up ArXiv Grapher API...")
    
    # 1. Connect to Neo4j
    await db.connect()
    
    # 2. Start the background asyncio worker pool
    CONCURRENCY_LIMIT = 3
    print(f"🚀 Spinning up {CONCURRENCY_LIMIT} concurrent background workers...")
    
    # We use a list to keep track of all our running workers
    worker_tasks = []
    for _ in range(CONCURRENCY_LIMIT):
        task = asyncio.create_task(background_worker())
        worker_tasks.append(task)
    
    yield # The FastAPI app runs here
    
    # --- SHUTDOWN SEQUENCE ---
    print("🛑 Shutting down application...")
    
    # Cancel all background workers gracefully
    for task in worker_tasks:
        task.cancel()
        
    await db.close()

# Initialize FastAPI
app = FastAPI(lifespan=lifespan)

# Include our API endpoints
app.include_router(router)