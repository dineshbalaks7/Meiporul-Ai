from collections import defaultdict
from pathlib import Path
from app.services.file_service import calculate_file_hash
from app.loaders.vector_store import get_vector_store


UPLOAD_DIR = Path("data/uploads")


def list_documents():

    vector_store = get_vector_store()

    records = vector_store.get(
        include=["metadatas"]
    )

    documents = defaultdict(lambda: {
        "document_id": None,
        "filename": None,
        "file_type": None,
        "total_chunks": 0
    })

    for metadata in records["metadatas"]:

        if not metadata:
            continue

        document_id = metadata.get("document_id")

        if not document_id:
            continue

        documents[document_id]["document_id"] = document_id
        documents[document_id]["filename"] = metadata.get("source")
        documents[document_id]["file_type"] = metadata.get("file_type")
        documents[document_id]["total_chunks"] += 1

    return list(documents.values())

def find_duplicate_document(file_hash):

    vector_store = get_vector_store()

    records = vector_store.get(
        include=["metadatas"]
    )

    checked_documents = set()

    for metadata in records["metadatas"]:

        if not metadata:
            continue

        document_id = metadata.get("document_id")

        if not document_id or document_id in checked_documents:
            continue

        checked_documents.add(document_id)

        if metadata.get("file_hash") == file_hash:
            return {
                "document_id": document_id,
                "filename": metadata.get("source"),
                "status": "duplicate"
            }

    return None


from app.services.file_service import calculate_file_hash


def backfill_document_hashes():

    vector_store = get_vector_store()

    records = vector_store.get(
        include=["metadatas"]
    )

    updated_documents = 0
    skipped_documents = 0

    processed_documents = set()

    for metadata in records["metadatas"]:

        if not metadata:
            continue

        document_id = metadata.get("document_id")

        if not document_id or document_id in processed_documents:
            continue

        processed_documents.add(document_id)

        # Skip documents that already have a hash
        if metadata.get("file_hash"):
            skipped_documents += 1
            continue

        # Find the original uploaded file
        file_path = None

        for extension in [".pdf", ".txt", ".docx"]:
            candidate = UPLOAD_DIR / f"{document_id}{extension}"

            if candidate.exists():
                file_path = candidate
                break

        if not file_path:
            skipped_documents += 1
            continue

        # Calculate hash
        file_hash = calculate_file_hash(file_path)

        # Update metadata for all chunks belonging to this document
        document_records = vector_store.get(
            where={"document_id": document_id},
            include=["metadatas"]
        )

        updated_metadatas = []

        for chunk_metadata in document_records["metadatas"]:
            updated_metadata = dict(chunk_metadata)
            updated_metadata["file_hash"] = file_hash
            updated_metadatas.append(updated_metadata)

        vector_store._collection.update(
            ids=document_records["ids"],
            metadatas=updated_metadatas
        )

        updated_documents += 1

    return {
        "updated_documents": updated_documents,
        "skipped_documents": skipped_documents
    }


def delete_document(document_id):

    vector_store = get_vector_store()

    records = vector_store.get(
        where={"document_id": document_id},
        include=["metadatas"]
    )

    if not records["ids"]:
        return {
            "status": "not_found",
            "message": "Document not found."
        }

    # Delete ChromaDB chunks
    vector_store.delete(
        ids=records["ids"]
    )

    # Delete original uploaded file
    deleted_file = False

    for extension in [".pdf", ".txt", ".docx"]:
        file_path = UPLOAD_DIR / f"{document_id}{extension}"

        if file_path.exists():
            file_path.unlink()
            deleted_file = True
            break

    return {
        "status": "deleted",
        "document_id": document_id,
        "deleted_chunks": len(records["ids"]),
        "deleted_file": deleted_file
    }