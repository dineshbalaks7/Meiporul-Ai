
import numpy as np

from langchain_huggingface import HuggingFaceEmbeddings


# Initialize the embedding model
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


def generate_embeddings(chunks):
    embeddings = embedding_model.embed_documents(chunks)
    return np.array(embeddings)


def generate_query_embedding(query):
    query_embedding = embedding_model.embed_query(query)
    return np.array(query_embedding)
