
from app.loaders.vector_store import get_vector_store


def retrieve_documents(query, document_id=None, top_k=5):

    vector_store = get_vector_store()

    # Support both a single query and multiple queries
    if isinstance(query, str):
        queries = [query]
    else:
        queries = query

    search_filter = (
        {"document_id": document_id}
        if document_id
        else None
    )

    retrieved_documents = []
    seen_chunks = set()

    print("\n========== MULTI-QUERY RETRIEVAL ==========")

    for query_index, search_query in enumerate(queries, 1):

        print(f"\nSub-query {query_index}: {search_query}")

        results = vector_store.similarity_search_with_score(
            query=search_query,
            k=top_k,
            filter=search_filter
        )

        print("Retrieved:", len(results))

        for document, distance in results:

            metadata = document.metadata

            # Create a unique key to avoid duplicate chunks
            chunk_key = (
                metadata.get("document_id"),
                metadata.get("page_number"),
                document.page_content
            )

            if chunk_key in seen_chunks:
                continue

            seen_chunks.add(chunk_key)

            retrieved_documents.append({
                "text": document.page_content,
                "metadata": metadata,
                "distance": distance,
                "retrieval_query": search_query
            })

    print("\nTotal unique chunks:", len(retrieved_documents))
    print("===========================================")

    # Display retrieved chunks
    print("\n========== RETRIEVED CHUNKS ==========")

    for index, doc in enumerate(retrieved_documents, 1):

        print(f"\nChunk {index}")
        print("Source:", doc["metadata"].get("source"))
        print("Page:", doc["metadata"].get("page_number"))
        print("Distance:", doc["distance"])
        print("Retrieved using:", doc["retrieval_query"])
        print("Content:", doc["text"][:300])

    print("======================================")

    return retrieved_documents
