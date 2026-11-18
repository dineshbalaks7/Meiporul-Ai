
from pathlib import Path

from langchain_community.document_loaders import (
    PyMuPDFLoader,
    TextLoader,
    Docx2txtLoader
)


def load_document(file_path):

    file_path = Path(file_path)

    if not file_path.exists():
        raise FileNotFoundError(
            f"Document not found: {file_path}"
        )

    extension = file_path.suffix.lower()

    # Select loader based on file extension
    if extension == ".pdf":
        loader = PyMuPDFLoader(str(file_path))

    elif extension == ".txt":
        loader = TextLoader(
            str(file_path),
            encoding="utf-8"
        )

    elif extension == ".docx":
        loader = Docx2txtLoader(str(file_path))

    else:
        raise ValueError(
            "Unsupported file format. "
            "Upload PDF, TXT or DOCX."
        )

    # Extract document content
    documents = loader.load()

    # Standardize metadata
    for document in documents:

        document.metadata["source"] = file_path.name

        if "page" in document.metadata:
            document.metadata["page_number"] = (
                int(document.metadata["page"]) + 1
            )

    return documents
