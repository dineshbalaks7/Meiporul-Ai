
from pathlib import Path
from langchain_chroma import Chroma
from app.loaders.embeddings import embedding_model

_vector_store = None


def get_vector_store():
    """Lazy load Chroma vector store so startup is instantaneous."""
    global _vector_store
    if _vector_store is None:
        db_dir = Path("./chroma_db")
        db_dir.mkdir(parents=True, exist_ok=True)
        print("[VECTOR STORE] Connecting to ChromaDB collection 'documind_chunks'...")
        _vector_store = Chroma(
            collection_name="documind_chunks",
            embedding_function=embedding_model,
            persist_directory=str(db_dir)
        )
        print("[VECTOR STORE] ChromaDB connected successfully.")
    return _vector_store


class _LazyVectorStore:
    """Transparent proxy that defers initialization until first query or index."""

    def __getattr__(self, name):
        return getattr(get_vector_store(), name)

    def similarity_search_with_relevance_scores(self, *args, **kwargs):
        return get_vector_store().similarity_search_with_relevance_scores(*args, **kwargs)

    def get(self, *args, **kwargs):
        return get_vector_store().get(*args, **kwargs)

    def delete(self, *args, **kwargs):
        return get_vector_store().delete(*args, **kwargs)

    def add_documents(self, *args, **kwargs):
        return get_vector_store().add_documents(*args, **kwargs)


vector_store = _LazyVectorStore()
