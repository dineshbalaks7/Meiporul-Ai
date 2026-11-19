
import numpy as np
from langchain_huggingface import HuggingFaceEmbeddings

_embedding_model = None


def get_embedding_model():
    """Lazy load embedding model so app starts and binds to port instantly."""
    global _embedding_model
    if _embedding_model is None:
        print("[EMBEDDINGS] Loading sentence-transformers/all-MiniLM-L6-v2...")
        _embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        print("[EMBEDDINGS] Embedding model loaded successfully.")
    return _embedding_model


class _LazyEmbeddings:
    """Transparent proxy that defers initialization until first usage."""

    def __getattr__(self, name):
        return getattr(get_embedding_model(), name)

    def embed_documents(self, texts):
        return get_embedding_model().embed_documents(texts)

    def embed_query(self, text):
        return get_embedding_model().embed_query(text)


embedding_model = _LazyEmbeddings()


def generate_embeddings(chunks):
    embeddings = get_embedding_model().embed_documents(chunks)
    return np.array(embeddings)


def generate_query_embedding(query):
    query_embedding = get_embedding_model().embed_query(query)
    return np.array(query_embedding)
