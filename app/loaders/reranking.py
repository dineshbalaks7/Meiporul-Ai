
import torch
from collections import Counter
from sentence_transformers import CrossEncoder

# SOTA 2024 lightweight reranker from mixedbread.ai
# float32 on CPU achieves ~23ms per pair inference with high precision (~250MB RAM)
reranker = CrossEncoder(
    "mixedbread-ai/mxbai-rerank-xsmall-v1",
    max_length=512,
    model_kwargs={"torch_dtype": torch.float32}
)


def rerank_documents(query, retrieved_docs):

    pairs = [
        [query, document["text"]]
        for document in retrieved_docs
    ]

    scores = reranker.predict(pairs)

    for document, score in zip(retrieved_docs, scores):
        document["rerank_score"] = float(score)

    reranked_docs = sorted(
        retrieved_docs,
        key=lambda document: document["rerank_score"],
        reverse=True
    )

    # Debug document distribution
    counts = Counter(
        doc["metadata"].get("source", "Unknown")
        for doc in reranked_docs
    )

    print("\n========== RERANKING DEBUG ==========")

    for index, doc in enumerate(reranked_docs, 1):
        print(f"\nRank: {index}")
        print("Source:", doc["metadata"].get("source"))
        print("Score:", round(doc["rerank_score"], 4))
        print("Content:", doc["text"][:200])

    print("\nDocument distribution:", dict(counts))
    print("====================================")

    return reranked_docs
