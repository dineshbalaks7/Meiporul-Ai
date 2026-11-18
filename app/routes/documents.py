
import shutil
import uuid

from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.document_service import index_document
from app.services.document_manager import (
    list_documents,
    delete_document,
    find_duplicate_document
)
from app.services.file_service import calculate_file_hash


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required."
        )

    original_filename = Path(file.filename).name
    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format."
        )

    document_id = str(uuid.uuid4())
    saved_path = UPLOAD_DIR / f"{document_id}{extension}"

    try:
        # Save uploaded file
        with saved_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Calculate SHA-256 hash
        file_hash = calculate_file_hash(saved_path)

        # Check for duplicate documents
        duplicate = find_duplicate_document(file_hash)

        if duplicate:
            saved_path.unlink(missing_ok=True)

            raise HTTPException(
                status_code=409,
                detail={
                    "message": "This document has already been uploaded.",
                    "existing_document": duplicate
                }
            )

        # Index the document
        result = index_document(
            file_path=saved_path,
            document_id=document_id,
            original_filename=original_filename,
            file_hash=file_hash
        )

        return {
            "message": "Document uploaded successfully",
            **result
        }

    except HTTPException:
        raise

    except Exception as error:
        if saved_path.exists():
            saved_path.unlink()

        raise HTTPException(status_code=500, detail=str(error))

    finally:
        await file.close()


@router.get("/")
def get_documents():
    return {"documents": list_documents()}


@router.delete("/{document_id}")
def remove_document(document_id: str):
    result = delete_document(document_id)

    if result["status"] == "not_found":
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return result
