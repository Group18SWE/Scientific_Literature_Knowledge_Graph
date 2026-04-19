import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # <-- Import this
from core.database import db
from worker.processor import background_worker
from api.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages the startup and shutdown sequence of our API."""
    print("🚀 Starting up ArXiv Grapher API...")
    await db.connect()
    
    CONCURRENCY_LIMIT = 2
    worker_tasks = [asyncio.create_task(background_worker()) for _ in range(CONCURRENCY_LIMIT)]
    
    yield 
    
    print("🛑 Shutting down application...")
    for task in worker_tasks:
        task.cancel()
    await db.close()

app = FastAPI(lifespan=lifespan)

# --- CORS CONFIGURATION ---
# Add the origins your React app uses (Vite uses 5173 by default)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Allow all origins
    allow_credentials=False,  # Must be False if allow_origins is ["*"]
    allow_methods=["*"],      # Allow all HTTP methods
    allow_headers=["*"],      # Allow all request headers
)
app.include_router(router)