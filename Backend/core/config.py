import os
from dotenv import load_dotenv

# Load credentials from the .env file
load_dotenv()

class Settings:
    NEO4J_URI = os.getenv("NEO4J_URI")
    NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    PAPER_PROCESS_CONCURRENCY = int(os.getenv("PAPER_PROCESS_CONCURRENCY", "3"))
    PAPER_HTML_TIMEOUT_SECONDS = int(os.getenv("PAPER_HTML_TIMEOUT_SECONDS", "30"))
    PAPER_EXTRACTION_TIMEOUT_SECONDS = int(os.getenv("PAPER_EXTRACTION_TIMEOUT_SECONDS", "90"))
    PAPER_DB_TIMEOUT_SECONDS = int(os.getenv("PAPER_DB_TIMEOUT_SECONDS", "30"))

# Create an instance to be imported across our app
settings = Settings()
