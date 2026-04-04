import os
from dotenv import load_dotenv

# Load credentials from the .env file
load_dotenv()

class Settings:
    NEO4J_URI = os.getenv("NEO4J_URI")
    NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

# Create an instance to be imported across our app
settings = Settings()