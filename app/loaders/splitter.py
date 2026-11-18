
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Initialize the text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100,
    separators=["\n\n", "\n", " ", ""]
)


def split_documents(documents):

    chunks = text_splitter.split_documents(documents)

    return chunks
