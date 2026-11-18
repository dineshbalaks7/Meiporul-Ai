from pathlib import Path

from app.loaders.document_loader import load_document
from app.loaders.splitter import split_documents
from app.loaders.vector_store import get_vector_store


def index_document(file_path, document_id, original_filename,file_hash):
    file_path = Path(file_path)

    # 1. Load document
    documents = load_document(file_path)

    # 2. Split into chunks
    chunks = split_documents(documents)

    if not chunks:
        raise ValueError("No text content found in document.")

    # 3. Attach metadata
    for chunk in chunks:
        chunk.metadata["document_id"] = document_id
        chunk.metadata["source"] = original_filename
        chunk.metadata["file_type"] = file_path.suffix.lower()
        chunk.metadata["file_hash"] = file_hash

    # 4. Store chunks in ChromaDB
    vector_store = get_vector_store()

    chunk_ids = [
        f"{document_id}_{index}"
        for index in range(len(chunks))
    ]

    vector_store.add_documents(
        documents=chunks,
        ids=chunk_ids
    )

    return {
        "document_id": document_id,
        "filename": original_filename,
        "total_chunks": len(chunks),
        "status": "indexed"
    }