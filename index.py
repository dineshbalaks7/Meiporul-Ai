
from app.indexing import index_pdf


pdf_path = input("Enter PDF file path: ").strip().strip('"')

index_pdf(pdf_path)
