
import chromadb


def create_vector_store(chunks, embeddings, metadatas, ids):

    # Connect to persistent ChromaDB
    client = chromadb.PersistentClient(
        path="./chroma_db"
    )

    # Create or access collection
    collection = client.get_or_create_collection(
        name="documind_chunks",
        metadata={"hnsw:space": "cosine"}
    )

    # Store documents, embeddings and metadata
    collection.upsert(
        ids=ids,
        documents=chunks,
        embeddings=embeddings.tolist(),
        metadatas=metadatas
    )

    return collection


def retrieve_documents(query, collection, embedding_model, top_k=2):

    # Generate query embedding
    query_embedding = embedding_model.encode(
        query,
        convert_to_numpy=True
    )

    # Search ChromaDB
    results = collection.query(
        query_embeddings=[query_embedding.tolist()],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )

    retrieved_documents = []

    for i in range(len(results["ids"][0])):

        retrieved_documents.append({
            "text": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i]
        })

    return retrieved_documents
