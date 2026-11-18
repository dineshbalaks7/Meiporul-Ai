
from app.services.document_manager import list_documents

documents = list_documents()

print("\nIndexed Documents")
print("=" * 50)

for index, document in enumerate(documents, start=1):

    print(f"\nDocument {index}")
    print("Filename:", document["filename"])
    print("Document ID:", document["document_id"])
    print("File Type:", document["file_type"])
    print("Total Chunks:", document["total_chunks"])
    