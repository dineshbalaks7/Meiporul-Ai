import hashlib
import re

from app.services.retrieval_service import retrieve_documents
from app.loaders.reranking import rerank_documents
from app.loaders.generation import (
    generate_answer,
    rewrite_question,
    decompose_question,
    classify_question,
    generate_general_answer,
    _CHITCHAT_RE,
)
from app.services.citation_service import normalize_citations
from app.services.document_manager import get_document_info
from app.services.guardrail_service import (
    check_prompt_injection,
    sanitize_pii,
    check_general_scope,
    apply_output_guardrails,
)


# ==================================================
# CONFIGURATION
# ==================================================

MAX_SUB_QUERIES = 3

# Multi-query context selection
MULTI_QUERY_CHUNKS_PER_QUERY = 2
MAX_RANK_PER_QUERY = 5

# Single-query context selection
SINGLE_QUERY_MAX_CHUNKS = 5

# Context limits
MAX_CONTEXT_CHUNKS = 7
MAX_CONTEXT_CHARS = 10000

# Retrieval limits
SINGLE_QUERY_TOP_K = 8
MULTI_QUERY_TOP_K = 6


# ==================================================
# DOCUMENT HELPERS
# ==================================================

def _score(doc):
    value = doc.get("rerank_score")

    if isinstance(value, (int, float)):
        return float(value)

    return float("-inf")


def _page_value(page):
    try:
        return int(page)
    except (TypeError, ValueError):
        return 0


def _text_key(doc):
    return (doc.get("text", "") or "").strip()[:80]


def _chunk_id(doc):
    metadata = doc.get("metadata") or {}

    raw = "|".join([
        str(metadata.get("document_id")),
        str(metadata.get("source")),
        str(metadata.get("page_number")),
        (doc.get("text", "") or "").strip(),
    ])

    return hashlib.sha256(
        raw.encode("utf-8")
    ).hexdigest()


def _rank_sort(docs):
    return sorted(
        docs,
        key=lambda document: (
            -_score(document),
            str(
                (document.get("metadata") or {}).get(
                    "source", ""
                )
            ),
            _page_value(
                (document.get("metadata") or {}).get(
                    "page_number", 0
                )
            ),
            _text_key(document),
        ),
    )


def _reading_order(docs):
    """
    Restore document reading order before generation.
    """

    return sorted(
        docs,
        key=lambda document: (
            str(
                (document.get("metadata") or {}).get(
                    "source", ""
                )
            ),
            _page_value(
                (document.get("metadata") or {}).get(
                    "page_number", 0
                )
            ),
            _text_key(document),
        ),
    )


def _valid_document(document):
    if not isinstance(document, dict):
        return False

    content = document.get("text", "")

    return (
        isinstance(content, str)
        and bool(content.strip())
    )


def _copy_document(document):
    """
    Copy document and metadata to avoid shared mutations.
    """

    candidate = dict(document)

    candidate["metadata"] = dict(
        document.get("metadata") or {}
    )

    return candidate


# ==================================================
# ROUND-ROBIN CONTEXT SELECTION
# ==================================================

def _round_robin_select(
    query_rankings,
    max_per_query,
    max_rank=MAX_RANK_PER_QUERY,
):
    """
    Select unique chunks fairly across query rankings.

    Rules:
    - Never compare scores from different queries.
    - Each query has an individual chunk limit.
    - Skip duplicate chunks.
    - Ignore candidates beyond the rank limit.
    """

    selected = {}

    positions = [0] * len(query_rankings)
    query_counts = [0] * len(query_rankings)

    while len(selected) < MAX_CONTEXT_CHUNKS:

        made_progress = False

        for query_index, ranking in enumerate(query_rankings):

            if len(selected) >= MAX_CONTEXT_CHUNKS:
                break

            if query_counts[query_index] >= max_per_query:
                continue

            while positions[query_index] < len(ranking):

                document = ranking[
                    positions[query_index]
                ]

                positions[query_index] += 1

                rank = document.get(
                    "query_rank",
                    positions[query_index],
                )

                # Ignore candidates beyond the rank limit.
                if rank > max_rank:
                    break

                chunk_key = _chunk_id(document)

                # Skip duplicate chunks.
                if chunk_key in selected:
                    continue

                candidate = _copy_document(document)

                candidate["selection_query"] = (
                    document.get("matched_sub_query")
                )

                candidate["selection_rank"] = rank

                selected[chunk_key] = candidate

                query_counts[query_index] += 1
                made_progress = True

                break

        if not made_progress:
            break

    return list(selected.values())


# ==================================================
# CONTEXT SIZE LIMIT
# ==================================================

def _limit_context(docs):
    """
    Keep complete chunks within the character budget.

    Never truncate a chunk because truncation can
    damage evidence and citation accuracy.
    """

    selected = []
    total_chars = 0

    for document in docs:

        if not _valid_document(document):
            continue

        content = document["text"]

        if total_chars + len(content) > MAX_CONTEXT_CHARS:

            print(
                "Skipping chunk due to context budget:",
                len(content),
                "characters",
            )

            continue

        selected.append(document)
        total_chars += len(content)

    return selected


# ==================================================
# MAIN QUESTION PIPELINE
# ==================================================

def answer_question(query, document_id=None, chat_history=None):

    if not isinstance(query, str) or not query.strip():
        return {
            "answer": "Please enter a question.",
            "sources": [],
        }

    query = query.strip()
    chat_history = chat_history or []

    # --------------------------------------------------
    # INPUT GUARDRAIL 1: PROMPT INJECTION / JAILBREAK
    # --------------------------------------------------
    injection_check = check_prompt_injection(query)
    if injection_check.get("violated"):
        print("\n[GUARDRAIL TRIGGERED]: Prompt Injection Detected")
        return {
            "answer": injection_check["message"],
            "sources": [],
        }

    # --------------------------------------------------
    # INPUT GUARDRAIL 2: SANITIZE PII & SECRETS
    # --------------------------------------------------
    query = sanitize_pii(query)

    # --------------------------------------------------
    # INPUT GUARDRAIL 3: MINIMAL GENERAL SCOPE ENFORCEMENT
    # Declines coding, email composition, creative writing, generic recipes
    # --------------------------------------------------
    scope_check = check_general_scope(query)
    if scope_check.get("violated"):
        print("\n[GUARDRAIL TRIGGERED]: Out-of-Scope Task Refused")
        return {
            "answer": scope_check["message"],
            "sources": [],
        }

    # Clean and validate document_id
    if document_id:
        document_id = str(document_id).strip()
        if not document_id:
            document_id = None

    selected_document_name = None
    if document_id:
        doc_info = get_document_info(document_id)
        if doc_info:
            selected_document_name = doc_info.get("filename")

    # --------------------------------------------------
    # 0. INTENT CLASSIFICATION / STRICT RAG ROUTING
    # --------------------------------------------------

    if document_id:
        # STRICT RAG MODE: User explicitly selected a specific document.
        # Bypass general LLM fallback and enforce document-grounded answering.
        intent = "DOCUMENT"

        print("\n========== STRICT RAG MODE ==========")
        print(f"Target Document ID: {document_id}")
        print(f"Target Document Name: {selected_document_name or 'Unknown'}")
        print("Intent: DOCUMENT (Forced by document selection)")
        print("======================================\n")

        # Conversational greeting check for strict document mode
        if _CHITCHAT_RE.match(query):
            doc_label = f"**{selected_document_name}**" if selected_document_name else "the selected document"
            return {
                "answer": (
                    f"Hello! I am operating in strict document mode for {doc_label}. "
                    "Ask me any question about this document, and I will answer strictly based on its contents."
                ),
                "sources": [],
            }

    else:
        # Multi-document or general conversational mode
        intent = classify_question(
            query,
            chat_history
        )

        print("\n========== INTENT CLASSIFICATION ==========")
        print("Original question:", query)
        print("Detected intent:", intent)
        print("===========================================\n")

        if intent == "GENERAL":

            answer = generate_general_answer(
                query,
                chat_history
            )

            return apply_output_guardrails(answer, sources=[])

    # --------------------------------------------------
    # 1. QUESTION REWRITING
    # --------------------------------------------------

    retrieval_query = rewrite_question(
        query,
        chat_history
    )

    if not isinstance(retrieval_query, str):
        retrieval_query = query

    retrieval_query = retrieval_query.strip() or query

    print("\n========== QUESTION PROCESSING ==========")
    print("Original question:", query)
    print("Retrieval question:", retrieval_query)

    # --------------------------------------------------
    # 2. QUERY DECOMPOSITION
    # --------------------------------------------------

    sub_queries = (
        decompose_question(retrieval_query)
        or [retrieval_query]
    )

    # Clean and deduplicate queries.
    cleaned_queries = []
    seen_queries = set()

    for item in sub_queries:

        if not isinstance(item, str):
            continue

        item = item.strip()

        if not item:
            continue

        normalized = item.lower()

        if normalized not in seen_queries:
            seen_queries.add(normalized)
            cleaned_queries.append(item)

    if not cleaned_queries:
        cleaned_queries = [retrieval_query]

    # Defensive query limit.
    sub_queries = cleaned_queries[:MAX_SUB_QUERIES]

    print("\n========== QUERY DECOMPOSITION ==========")

    for index, sub_query in enumerate(sub_queries, start=1):
        print(f"Query {index}: {sub_query}")

    print("Total queries:", len(sub_queries))

    # --------------------------------------------------
    # 3. MULTI-QUERY RETRIEVAL
    # --------------------------------------------------

    top_k = (
        SINGLE_QUERY_TOP_K
        if len(sub_queries) == 1
        else MULTI_QUERY_TOP_K
    )

    retrieved_docs = retrieve_documents(
        query=sub_queries,
        document_id=document_id,
        top_k=top_k,
    )

    retrieved_docs = [
        _copy_document(document)
        for document in (retrieved_docs or [])
        if _valid_document(document)
    ]

    if not retrieved_docs:
        doc_label = f"the selected document ('{selected_document_name}')" if selected_document_name else "the selected document" if document_id else "the uploaded documents"
        return {
            "answer": (
                f"No relevant information was found in {doc_label}."
            ),
            "sources": [],
        }

    print("\n========== RETRIEVAL RESULTS ==========")
    print("Sub-queries:", len(sub_queries))
    print("Retrieved unique chunks:", len(retrieved_docs))

    # --------------------------------------------------
    # 4. QUERY-WISE CROSSENCODER RERANKING
    # --------------------------------------------------

    query_rankings = []

    for query_index, sub_query in enumerate(
        sub_queries,
        start=1,
    ):

        query_results = rerank_documents(
            sub_query,
            retrieved_docs,
        )

        query_results = _rank_sort(
            query_results or []
        )

        # Take a snapshot immediately because reranking
        # may modify the original document objects.
        ranking_snapshot = []

        for rank, document in enumerate(
            query_results,
            start=1,
        ):

            if not _valid_document(document):
                continue

            candidate = _copy_document(document)

            candidate["matched_sub_query"] = sub_query
            candidate["query_rank"] = rank

            ranking_snapshot.append(candidate)

        query_rankings.append(ranking_snapshot)

        print(
            f"Query {query_index}: "
            f"{len(ranking_snapshot)} ranked chunks"
        )

    # --------------------------------------------------
    # 5. CONTEXT SELECTION
    # --------------------------------------------------

    if len(sub_queries) == 1:

        final_docs = _round_robin_select(
            query_rankings,
            max_per_query=SINGLE_QUERY_MAX_CHUNKS,
            max_rank=SINGLE_QUERY_TOP_K,
        )

    else:

        final_docs = _round_robin_select(
            query_rankings,
            max_per_query=MULTI_QUERY_CHUNKS_PER_QUERY,
            max_rank=MAX_RANK_PER_QUERY,
        )

    if not final_docs:
        doc_label = f"the selected document ('{selected_document_name}')" if selected_document_name else "the selected document" if document_id else "the uploaded documents"
        return {
            "answer": (
                f"No relevant information was found in {doc_label}."
            ),
            "sources": [],
        }

    # Restore natural document reading order.
    final_docs = _reading_order(final_docs)

    # Apply context character limit.
    final_docs = _limit_context(final_docs)

    if not final_docs:
        doc_label = f"the selected document ('{selected_document_name}')" if selected_document_name else "the selected document" if document_id else "the uploaded documents"
        return {
            "answer": f"No usable content was found in {doc_label}.",
            "sources": [],
        }

    # --------------------------------------------------
    # CONTEXT DEBUG
    # --------------------------------------------------

    print("\n========== FINAL CONTEXT ==========")

    print("Retrieved chunks:", len(retrieved_docs))
    print("Selected chunks:", len(final_docs))

    print(
        "Context characters:",
        sum(
            len(doc.get("text", ""))
            for doc in final_docs
        ),
    )

    for index, document in enumerate(
        final_docs,
        start=1,
    ):

        metadata = document.get("metadata", {})

        print(
            f"Context {index} | "
            f"{metadata.get('source')} | "
            f"Page {metadata.get('page_number')} | "
            f"Score: {document.get('rerank_score')} | "
            f"Query: {document.get('matched_sub_query')} | "
            f"Query rank: {document.get('query_rank')}"
        )

    # --------------------------------------------------
    # 6. ANSWER GENERATION
    # --------------------------------------------------

    answer = generate_answer(
        query=query,
        retrieved_docs=final_docs,
        strict_mode=bool(document_id),
        document_name=selected_document_name,
    )

    if not isinstance(answer, str):
        answer = str(answer)

    print("\n========== RAW ANSWER ==========")
    print("Answer ending:", repr(answer[-150:]))

    print(
        "Contains citation:",
        bool(
            re.search(
                r"(?:\[\d+\]|【\d+】)",
                answer,
            )
        ),
    )

    # --------------------------------------------------
    # 7. SOURCE PREPARATION
    # --------------------------------------------------

    # Keep the exact same document order used by
    # generate_answer() for citation mapping.

    sources = []

    for document in final_docs:

        metadata = document.get("metadata", {})

        sources.append({
            "filename": metadata.get(
                "source",
                selected_document_name or "Unknown document",
            ),
            "page_number": metadata.get(
                "page_number",
                "N/A",
            ),
            "content": document.get("text", ""),
            "rerank_score": document.get("rerank_score"),
        })

    # --------------------------------------------------
    # 8. CITATION NORMALIZATION
    # --------------------------------------------------

    result = normalize_citations(
        answer,
        sources,
    )

    # If the strict RAG model replied with a refusal that the document does not contain the answer,
    # ensure no dangling source badges are displayed.
    refusal_signals = [
        "does not contain information",
        "not contain information",
        "does not mention",
        "not mentioned in the selected document",
        "not found in the selected document",
    ]
    if any(sig in result.get("answer", "").lower() for sig in refusal_signals):
        result["sources"] = []

    print("\n========== FINAL RESULT ==========")
    print(
        "Cited sources:",
        len(result.get("sources", [])),
    )

    # OUTPUT GUARDRAIL: Sanitize PII, clean format, and verify citation consistency
    return apply_output_guardrails(
        result.get("answer", ""),
        result.get("sources", [])
    )
