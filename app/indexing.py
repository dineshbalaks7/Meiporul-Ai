
from pathlib import Path

from app.pdf_loader import load_pdf
from app.chunking import chunk_text
from app.embeddings import generate_embeddings
from app.retrieval import create_vector_store


def index_pdf(file_path):

    pdf_path = Path(file_path)

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {file_path}")

    source_name = pdf_path.name

    # 1. Extract PDF pages
    pages = load_pdf(file_path)

    all_chunks = []
    all_metadatas = []
    all_ids = []

    # 2. Create chunks page by page
    for page in pages:

        chunks = chunk_text(
            page["text"],
            chunk_size=50,
            overlap=10
        )

        for chunk_index, chunk in enumerate(chunks):

            all_chunks.append(chunk)

            all_metadatas.append({
                "source": source_name,
                "page_number": page["page_number"],
                "chunk_index": chunk_index
            })

            all_ids.append(
                f"{pdf_path.stem}-page-{page['page_number']}-chunk-{chunk_index}"
            )

    if not all_chunks:
        raise ValueError("No extractable text found in PDF.")

    # 3. Generate embeddings
    embeddings = generate_embeddings(all_chunks)

    # 4. Store in ChromaDB
    collection = create_vector_store(
        all_chunks,
        embeddings,
        all_metadatas,
        all_ids
    )

    print("\nPDF indexed successfully!")
    print("PDF:", source_name)
    print("Total pages:", len(pages))
    print("Total chunks:", len(all_chunks))
    print("Total database records:", collection.count())

    return collection
