import os
import re
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv
from langchain_groq import ChatGroq


load_dotenv()

# ==================================================
# LLM INITIALIZATION
# ==================================================

MODEL_NAME = "openai/gpt-oss-120b"

# max_tokens raised: gpt-oss is a reasoning model, and reasoning tokens
# count toward this limit. 300 can produce empty responses.
llm_utility = ChatGroq(
    model=MODEL_NAME,
    temperature=0,
    max_tokens=800,
    api_key=os.getenv("GROQ_API_KEY"),
    seed=42,
    reasoning_effort="low",
)

llm_answer = ChatGroq(
    model=MODEL_NAME,
    temperature=0,
    max_tokens=2500,
    api_key=os.getenv("GROQ_API_KEY"),
    seed=42,
    reasoning_effort="low",
)

# General conversation model.
llm_general = ChatGroq(
    model=MODEL_NAME,
    temperature=0.3,
    max_tokens=2500,
    api_key=os.getenv("GROQ_API_KEY"),
    seed=42,
    reasoning_effort="low",
)

MAX_SUB_QUERIES = 3

# India Standard Time (UTC+05:30). A fixed offset avoids
# Windows timezone-database dependencies.
IST = timezone(timedelta(hours=5, minutes=30))

print("LOADED generation.py:", __file__)
print("Utility max tokens:", llm_utility.max_tokens)
print("Answer max tokens:", llm_answer.max_tokens)
print("General max tokens:", llm_general.max_tokens)


# ==================================================
# GENERAL CONVERSATION / INTENT ROUTING
# ==================================================

def _conversation_history_text(chat_history, max_messages=6):
    """Format recent conversation history for prompts."""

    if not chat_history:
        return ""

    history_parts = []

    for message in chat_history[-max_messages:]:
        if not isinstance(message, dict):
            continue

        role = str(message.get("role", "user")).upper()
        content = str(message.get("content", ""))[:1000]

        if content.strip():
            history_parts.append(f"{role}: {content}")

    return "\n".join(history_parts)


def _is_date_question(query):
    """Detect common requests for today's date or current day."""

    patterns = (
        r"\btoday'?s date\b",
        r"\bcurrent date\b",
        r"\bwhat date is it\b",
        r"\bwhat is the date\b",
        r"\btoday date\b",
        r"\bwhat day is today\b",
        r"\bwhich day is today\b",
        r"\bdate today\b",
    )

    text = query.lower().strip()
    return any(re.search(pattern, text) for pattern in patterns)


def _is_time_question(query):
    """Detect common requests for the current local time."""

    patterns = (
        r"\bcurrent time\b",
        r"\bwhat time is it\b",
        r"\btime right now\b",
        r"\bwhat is the time\b",
        r"\btime now\b",
    )

    text = query.lower().strip()
    return any(re.search(pattern, text) for pattern in patterns)


# Pure greetings / small talk only. Anything longer or more specific
# falls through to the next checks.
_CHITCHAT_RE = re.compile(
    r"^\s*(hi|hii+|hello|hey|thanks|thank you|bye|"
    r"good (morning|afternoon|evening|night)|"
    r"who are you|what can you do|how are you)\b[\s!.?]*$",
    re.IGNORECASE,
)

# Words that strongly suggest the question is about uploaded files.
_DOC_SIGNAL_RE = re.compile(
    r"\b(polic(y|ies)|document|documents|pdf|file|files|uploaded|"
    r"clause|section|page|according to|as per|handbook|manual|"
    r"contract|agreement|guidelines?|eligib\w*|requirements?|"
    r"leave|remote work|work from home|benefits?|summar(y|ize|ise))\b",
    re.IGNORECASE,
)


def classify_question(query, chat_history=None, has_documents=None):
    """
    Classify the latest message as GENERAL or DOCUMENT.

    This app is a document-QA system, so the default is DOCUMENT.
    Only clear non-document messages are routed to GENERAL.

    Order of decisions:
    1. Empty input            -> GENERAL
    2. Date/time              -> GENERAL
    3. Pure greeting/chitchat -> GENERAL
    4. Document keywords      -> DOCUMENT
    5. Otherwise ask the LLM, and default to DOCUMENT

    `has_documents` is accepted for backward compatibility but is
    intentionally NOT used for routing, because it can be computed
    incorrectly by the caller.
    """

    print(
        f"[generation.classify_question] CALLED "
        f"query={query!r} has_documents={has_documents!r}"
    )

    if not isinstance(query, str) or not query.strip():
        return "GENERAL"

    # Deterministic handling for obvious date/time requests.
    if _is_date_question(query) or _is_time_question(query):
        return "GENERAL"

    # Pure greetings never need retrieval.
    if _CHITCHAT_RE.match(query):
        return "GENERAL"

    # Strong document signals skip the LLM call entirely.
    if _DOC_SIGNAL_RE.search(query):
        print("[generation.classify_question] keyword match -> DOCUMENT")
        return "DOCUMENT"

    history = _conversation_history_text(chat_history)

    prompt = f"""You are an intent classifier for Meiporul AI.
The user HAS uploaded documents to this application.

Classify the latest message into exactly one category:

DOCUMENT:
- Anything that could plausibly be answered from the uploaded files.
- Questions about policies, rules, requirements, processes, reports,
  manuals or contracts, even if the message does not mention
  "document" or "PDF" (e.g. "what are the policies", "how many leave days").
- Requests to summarize, compare, extract or analyze.
- Follow-ups to a previous document-based answer.

GENERAL:
- Greetings and casual conversation.
- Clearly unrelated general knowledge, coding or educational questions
  (e.g. "what is a neural network", "write a Python loop").
- Questions about the assistant itself.

Important:
- Because documents are uploaded, when the message is ambiguous
  choose DOCUMENT.
- Return only GENERAL or DOCUMENT. Do not explain.

RECENT CONVERSATION:
{history}

LATEST USER MESSAGE:
{query}

CATEGORY:
"""

    try:
        response = llm_utility.invoke(prompt)
        result = str(response.content or "").strip().upper()

        print(f"[generation.classify_question] LLM result={result!r}")

        # Accept only a clear GENERAL response. Any other or
        # malformed output defaults to DOCUMENT for safer grounding.
        if result.startswith("GENERAL"):
            return "GENERAL"

        return "DOCUMENT"

    except Exception as error:
        print("Intent classification error:", str(error))
        return "DOCUMENT"


def generate_general_answer(query, chat_history=None):
    """Generate a normal conversational answer without document retrieval."""

    if not isinstance(query, str) or not query.strip():
        return "Please enter a question."

    current_time = datetime.now(IST)
    date_text = current_time.strftime("%A, %d %B %Y")
    time_text = current_time.strftime("%I:%M %p")

    if _is_date_question(query):
        return f"Today is {date_text} (IST)."

    if _is_time_question(query):
        return f"The current time is {time_text} IST."

    history = _conversation_history_text(chat_history)

    prompt = f"""You are Meiporul AI, a dedicated document intelligence assistant.

CURRENT DATE: {date_text}
CURRENT TIME: {time_text} IST

STRICT SCOPE LIMITATIONS (MANDATORY):
1. You are ONLY permitted to handle:
   - Polite greetings ("Hello", "Good morning", "Hey", "How are you?", "Thank you").
   - Explaining your identity and capabilities as Meiporul AI (document analysis, search, summarization, strict RAG QA).
   - Date and time inquiries.
   - Basic guidance on how to use the app or upload documents.
2. YOU MUST REFUSE:
   - Writing, generating, or debugging programming code (Python, JS, SQL, etc.).
   - Drafting or composing emails, cover letters, resignation letters, or personal correspondence.
   - Writing essays, stories, poems, jokes, or creative content.
   - Providing recipes, cooking instructions, fitness/diet plans, or unrelated external tutorials.
3. If the user asks for code, email writing, recipes, essays, or generic assistant tasks, respond politely:
   "I am Meiporul AI, a dedicated document intelligence assistant. I don't write code or draft generic content like emails. Please upload or select a document, and I will be happy to answer questions based on its contents!"
4. For allowed minimal greetings and questions, be friendly, brief (1 to 3 sentences), and direct.

RECENT CONVERSATION:
{history}

USER QUESTION:
{query}

ANSWER:
"""
    try:
        response = llm_general.invoke(prompt)
        answer = response.content

        if not isinstance(answer, str):
            answer = str(answer) if answer is not None else ""

        answer = answer.strip()

        if not answer:
            return "I couldn't generate a response. Please try again."

        return answer

    except Exception as error:
        print("General answer generation error:", str(error))
        return "I'm having trouble responding right now. Please try again."


# ==================================================
# DOCUMENT QUESTION CLASSIFICATION
# ==================================================

def _is_requirement_question(query):

    pattern = (
        r"\b(requirements?|rules?|eligib\w*|conditions?|criteria|"
        r"steps?|process|procedure|policies|restrictions?|"
        r"what are the|list)\b"
    )

    return bool(re.search(pattern, query.lower()))


def _needs_decomposition(query):
    """
    Avoid an unnecessary LLM call for simple questions.
    Broad questions still use query decomposition.
    """

    text = query.lower().strip()

    broad_patterns = (
        r"\brequirements?\b",
        r"\bcriteria\b",
        r"\bconditions?\b",
        r"\bprocess\b",
        r"\bprocedures?\b",
        r"\bsteps?\b",
        r"\bcompare\b",
        r"\bcomparison\b",
        r"\bdifferences?\b",
        r"\bsimilarities\b",
        r"\badvantages\b",
        r"\bdisadvantages\b",
        r"\btypes of\b",
        r"\bcomponents of\b",
        r"\bexplain all\b",
        r"\boverview\b",
    )

    if any(re.search(pattern, text) for pattern in broad_patterns):
        return True

    # Multiple explicit aspects often need separate retrieval queries.
    connectors = (
        " and ",
        " as well as ",
        " along with ",
        " including ",
    )

    return any(connector in text for connector in connectors)


# ==================================================
# DOCUMENT ANSWER GENERATION
# ==================================================

def generate_answer(query, retrieved_docs, strict_mode: bool = False, document_name: str | None = None):

    print(f"\nPROMPT VERSION: v5-token-optimized (strict_mode={strict_mode}, doc={document_name})")

    if not retrieved_docs:
        doc_label = f"the selected document ('{document_name}')" if document_name else "the selected document" if strict_mode else "the uploaded documents"
        return f"No relevant information was found in {doc_label}."

    # --------------------------------------------------
    # BUILD NUMBERED CONTEXT
    # --------------------------------------------------

    context_parts = []

    for document in retrieved_docs:

        metadata = document.get("metadata", {})
        content = document.get("text", "")

        if not isinstance(content, str) or not content.strip():
            continue

        source_number = len(context_parts) + 1

        filename = metadata.get("source", document_name or "Unknown document")
        page_number = metadata.get("page_number", "N/A")

        context_parts.append(
            f"[SOURCE {source_number}]\n"
            f"Document: {filename}\n"
            f"Page: {page_number}\n"
            f"{content.strip()}"
        )

    if not context_parts:
        doc_label = f"the selected document ('{document_name}')" if document_name else "the selected document" if strict_mode else "the uploaded documents"
        return f"No usable content was found in {doc_label} for this question."

    context = "\n\n".join(context_parts)

    # --------------------------------------------------
    # RESPONSE FORMAT
    # --------------------------------------------------

    if _is_requirement_question(query):

        format_rule = """
FORMAT:
- Provide all applicable points, rules, or requirements completely without omitting any.
- Use clear bullet points.
- Do not truncate or arbitrarily combine separate rules.
- Preserve all important items, conditions, numbers, and exceptions.
- Cite every factual bullet with its source number (e.g. [1], [2]).
"""

    else:

        format_rule = """
FORMAT:
- Answer completely and directly using bullet points or paragraphs as best fits the question.
- Do not truncate or omit relevant details found in the context.
- Cite every factual statement with its source number (e.g. [1], [2]).
"""

    # --------------------------------------------------
    # COMPACT ANSWER PROMPT
    # --------------------------------------------------

    if strict_mode:
        doc_heading = f"the selected document '{document_name}'" if document_name else "the selected document"
        prompt = f"""You are Meiporul AI acting as a STRICT DOCUMENT QUESTION-ANSWERING SYSTEM.

Your task is to answer the user's question STRICTLY and EXCLUSIVELY using the retrieved context from {doc_heading}.

STRICT RAG RULES (MANDATORY):
1. You MUST rely ONLY on the clear, explicit facts provided in the CONTEXT below.
2. DO NOT use any outside knowledge, prior training data, external facts, or personal assumptions.
3. If the provided context does NOT contain enough evidence or facts to answer the question, or if the question is unrelated to this document (e.g. general knowledge, baking recipes, coding advice, outside trivia), you MUST REFUSE to answer with outside knowledge and state:
"The selected document does not contain information to answer this question."
4. Never speculate, extrapolate, or guess.
5. Every single factual statement or claim in your response MUST include citation numbers corresponding to the source numbers in the context (e.g. [1], [2]).
6. Do NOT invent citation numbers. Only use citation numbers that exist in the CONTEXT.

{format_rule}

CONTEXT:
{context}

QUESTION:
{query}

ANSWER:
"""
    else:
        prompt = f"""You are Meiporul AI, a document-grounded question-answering system.

Answer the user's question using ONLY the retrieved context.

RULES:
1. Answer the exact question.
2. Use clear, simple language.
3. Do not add outside knowledge or assumptions.
4. Do not include unrelated document information.
5. Preserve important numbers, deadlines and conditions.
6. Do not omit critical exceptions relevant to the question.
7. If evidence is missing, say so. Never guess.
8. Use multiple documents only when their retrieved content supports the answer.

CITATIONS:
- Every factual statement must have a citation.
- Use only source numbers shown in the context.
- Valid formats: [1], [2], [1][2].
- Never invent citation numbers.

{format_rule}

CONTEXT:
{context}

QUESTION:
{query}

ANSWER:
"""

    # --------------------------------------------------
    # GENERATE
    # --------------------------------------------------

    try:

        response = llm_answer.invoke(prompt)

        answer = response.content

        if not isinstance(answer, str):
            answer = str(answer) if answer is not None else ""

        answer = answer.strip()

        metadata = response.response_metadata or {}

        print("\n========== GENERATION DEBUG ==========")
        print("Finish reason:", metadata.get("finish_reason"))
        print("Token usage:", metadata.get("token_usage"))
        print("Prompt characters:", len(prompt))
        print("Context characters:", len(context))
        print("Answer characters:", len(answer))
        print("Answer ending:", repr(answer[-150:]))
        print("======================================\n")

        if not answer:
            return "The model did not generate an answer. Please try again."

        return answer

    except Exception as error:

        print("Answer generation error:", str(error))

        return (
            "An error occurred while generating "
            "the answer. Please try again."
        )


# ==================================================
# QUESTION REWRITING
# ==================================================

def rewrite_question(query, chat_history):

    if not chat_history:
        return query

    # Only recent history is needed to resolve references.
    recent_history = chat_history[-6:]

    history_parts = []

    for message in recent_history:

        role = message.get("role", "user").upper()
        content = str(message.get("content", ""))[:1200]

        history_parts.append(f"{role}: {content}")

    history = "\n".join(history_parts)

    prompt = f"""Rewrite the latest question as a standalone search query.

Use conversation history only to resolve references.
Preserve the original meaning.
Do not answer or add new information.
Return only the rewritten question.

HISTORY:
{history}

QUESTION:
{query}

REWRITTEN QUERY:
"""

    try:

        response = llm_utility.invoke(prompt)

        rewritten = (
            response.content.strip()
            if response.content
            else ""
        )

        return rewritten or query

    except Exception as error:

        print("Question rewriting error:", str(error))
        return query


# ==================================================
# QUERY DECOMPOSITION
# ==================================================

def decompose_question(query):

    # Skip decomposition for simple factual questions.
    if not _needs_decomposition(query):
        print("Decomposition skipped: simple question.")
        return [query]

    prompt = f"""Break this question into 2 or 3 focused search queries.

RULES:
- Cover different aspects of the same question.
- Preserve the original topic.
- Avoid duplicate queries.
- Do not answer.
- Return only one query per line.
- No numbering or explanations.

QUESTION:
{query}

SEARCH QUERIES:
"""

    try:

        response = llm_utility.invoke(prompt)

        response_text = (
            response.content
            if response.content
            else ""
        )

        queries = []

        for line in response_text.splitlines():

            item = re.sub(
                r"^\s*(?:[-*]|\d+[.)])\s*",
                "",
                line
            ).strip()

            if item and len(item) <= 250:
                queries.append(item)

        # Deduplicate while preserving order.
        seen = set()
        cleaned = []

        for item in queries:

            normalized = item.lower()

            if normalized not in seen:
                seen.add(normalized)
                cleaned.append(item)

        # Include the original question if missing.
        if query.lower() not in seen:
            cleaned.insert(0, query)

        # Apply the limit BEFORE printing result.
        result = cleaned[:MAX_SUB_QUERIES]

        if not result:
            result = [query]

        # Debug output
        print("\n========== DECOMPOSITION DEBUG ==========")
        print("Loaded file:", __file__)
        print("Maximum queries:", MAX_SUB_QUERIES)
        print("Model generated:", len(cleaned))
        print("Final query count:", len(result))

        for index, item in enumerate(result, 1):
            print(f"Query {index}: {item}")

        print("=========================================\n")

        return result

    except Exception as error:

        print("Query decomposition error:", str(error))
        return [query]