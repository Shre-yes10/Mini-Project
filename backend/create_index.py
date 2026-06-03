import os
from dotenv import load_dotenv
from pymongo import MongoClient

def create_vector_search_index():
    load_dotenv()
    uri = os.environ.get("MONGODB_URI")
    db_name = os.environ.get("MONGODB_DB")
    
    if not uri or not db_name:
        print("MongoDB URI or DB format not found. Check .env")
        return

    client = MongoClient(uri)
    db = client[db_name]
    
    # Create collection if it doesn't exist
    if "project_log_embeddings" not in db.list_collection_names():
        db.create_collection("project_log_embeddings")
        print("Created collection 'project_log_embeddings'")
        
    collection = db["project_log_embeddings"]
    
    # Define the search index model
    search_index_model = {
        "name": "project_log_embeddings_index",
        "type": "vectorSearch",
        "definition": {
            "fields": [
                {
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": 384,
                    "similarity": "cosine"
                },
                {
                    "type": "filter",
                    "path": "user_id"
                },
                {
                    "type": "filter",
                    "path": "project_id"
                }
            ]
        }
    }

    try:
        # Create the search index
        print("Creating Vector Search index...")
        db.command("createSearchIndexes", "project_log_embeddings", indexes=[search_index_model])
        print("Successfully initiated Vector Search index creation. It may take a few minutes to complete on Atlas.")
    except Exception as e:
        print(f"Error creating vector search index: {e}")

if __name__ == "__main__":
    create_vector_search_index()
