from neo4j import GraphDatabase
from core.config import settings

class Neo4jConnection:
    def __init__(self):
        self.driver = None

    def connect(self):
        try:
            uri = settings.NEO4J_URI
            user = settings.NEO4J_USER
            password = settings.NEO4J_PASSWORD
            assert uri is not None
            assert user is not None
            assert password is not None
            auth=(user, password)
            self.driver = GraphDatabase.driver(
                uri, 
                auth=auth
            )
            self.driver.verify_connectivity()
            print("🟢 Successfully connected to Neo4j AuraDB!")
        except Exception as e:
            print(f"🔴 Failed to connect to Neo4j: {e}")

    def close(self):
        if self.driver is not None:
            self.driver.close()
            print("🛑 Neo4j connection closed.")

# Create a single instance to use throughout the app
db = Neo4jConnection()