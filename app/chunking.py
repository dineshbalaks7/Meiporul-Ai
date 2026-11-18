
from pathlib import Path


def load_document(file_path):
    """Read the document from a text file."""
    text = Path(file_path).read_text(encoding="utf-8")
    return text


def chunk_text(text, chunk_size=50, overlap=10):
    """Split text into fixed-size word chunks with overlap."""

    words = text.split()

    if chunk_size <= 0:
        raise ValueError("Chunk size must be positive")

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("Overlap must be between 0 and chunk_size")

    chunks = []
    start = 0

    while start < len(words):
        end = start + chunk_size

        chunk = words[start:end]
        chunks.append(" ".join(chunk))

        if end >= len(words):
            break

        start = end - overlap

    return chunks
