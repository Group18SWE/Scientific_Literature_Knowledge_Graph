import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI

# Import our separated modules
from core.database import db
from worker.processor import background_worker
from api.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages the startup and shutdown sequence of our API."""
    print("🚀 Starting up ArXiv Grapher API...")
    
    # 1. Connect to Neo4j
    db.connect()
    
    # 2. Start the background asyncio worker
    worker_task = asyncio.create_task(background_worker())
    
    yield # The FastAPI app runs here
    
    # --- SHUTDOWN SEQUENCE ---
    print("🛑 Shutting down application...")
    worker_task.cancel()
    db.close()

# Initialize FastAPI
app = FastAPI(lifespan=lifespan)

# Include our API endpoints
app.include_router(router)