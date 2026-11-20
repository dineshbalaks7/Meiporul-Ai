
from langchain_chroma import Chroma

from app.loaders.embeddings import embedding_model


# Connect to the existing ChromaDB collection
vector_store = Chroma(
    collection_name="documind_chunks",
    embedding_function=embedding_model,
    persist_directory="./chroma_db"
)


def get_vector_store():
    return vector_store
