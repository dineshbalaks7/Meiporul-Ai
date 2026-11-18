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

llm_utility = ChatGroq(
    model=MODEL_NAME,
    temperature=0,
    max_tokens=300,
    api_key=os.getenv("GROQ_API_KEY"),
    seed=42,
    reasoning_effort="low",
)

llm_answer = ChatGroq(
    model=MODEL_NAME,
    temperature=0,
    max_tokens=1500,
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


def classify_question(query, chat_history=None):
    """
    Classify the latest message as GENERAL or DOCUMENT.

    Fail safely to DOCUMENT so document-grounded questions
    do not accidentally bypass retrieval when classification fails.
    """

    if not isinstance(query, str) or not query.strip():
        return "GENERAL"

    # Deterministic handling for obvious date/time requests.
    if _is_date_question(query) or _is_time_question(query):
        return "GENERAL"

    history = _conversation_history_text(chat_history)

    prompt = f"""You are an intent classifier for Meiporul AI.

Classify the user's latest message into exactly one category:

GENERAL:
- Greetings and casual conversations.
- General knowledge questions.
- Programming, coding and educational questions.
- Everyday questions that do not depend on uploaded files.
- Questions about the current date or time.
- Requests for explanations of general concepts.

DOCUMENT:
- Questions asking about uploaded PDFs or files.
- Questions about the contents of uploaded documents.
- Questions about policies, reports, manuals or contracts that
  have been uploaded to this application.
- Requests to summarize, compare, extract or analyze uploaded files.
- Follow-up questions referring to information retrieved from
  an uploaded document in the conversation.

Important:
- Classify based on what the user is asking, not merely the topic.
- A general question about a policy topic is GENERAL unless it
  asks about an uploaded document.
- If the latest message refers to "this document", "that PDF",
  "the policy", or a previous document answer, classify it as DOCUMENT.
- Return only GENERAL or DOCUMENT. Do not explain your choice.

RECENT CONVERSATION:
{history}

LATEST USER MESSAGE:
{query}

CATEGORY:
"""

    try:
        response = llm_utility.invoke(prompt)
        result = str(response.content or "").strip().upper()

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

    prompt = f"""You are Meiporul AI, a helpful and intelligent AI assistant.

CURRENT DATE: {date_text}
CURRENT TIME: {time_text} IST

RESPONSE STYLE:
- Be concise, natural and conversational.
- Give direct answers without unnecessary explanations.
- For simple questions, answer in 2-4 sentences.
- Use simple language that is easy to understand.
- Avoid lengthy introductions and conclusions.
- Do not use tables unless explicitly requested.
- Do not provide multiple examples unless requested.
- Do not list every category, type, algorithm or application
  unless the user asks for a detailed explanation.
- Use bullet points only when they improve readability.

DETAIL LEVEL:
- Simple question: Short answer.
- Explanation request: Moderate explanation.
- Detailed explanation request: Comprehensive answer.
- If the user asks "in detail", "explain deeply" or "with examples",
  provide a more detailed response.

CONVERSATION:
- Respond naturally to greetings.
- Understand follow-up questions using conversation history.
- Do not unnecessarily mention uploaded documents.
- Do not invent real-time information.

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

def generate_answer(query, retrieved_docs):

    print("\nPROMPT VERSION: v5-token-optimized")

    if not retrieved_docs:
        return (
            "No relevant information was found "
            "in the uploaded documents."
        )

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

        filename = metadata.get("source", "Unknown document")
        page_number = metadata.get("page_number", "N/A")

        context_parts.append(
            f"[SOURCE {source_number}]\n"
            f"Document: {filename}\n"
            f"Page: {page_number}\n"
            f"{content.strip()}"
        )

    if not context_parts:
        return "No usable document content was found for this question."

    context = "\n\n".join(context_parts)

    # --------------------------------------------------
    # RESPONSE FORMAT
    # --------------------------------------------------

    if _is_requirement_question(query):

        format_rule = """
FORMAT:
- Use a maximum of 6 concise bullet points.
- One bullet per main requirement.
- Combine closely related details.
- Preserve important deadlines, numbers and exceptions.
- Do not use nested bullets or lengthy explanations.
- Cite every factual bullet.
"""

    else:

        format_rule = """
FORMAT:
- Answer directly in a concise paragraph or short list.
- Explain only what the question asks.
- Avoid repetition and unrelated information.
- Cite every factual statement.
"""

    # --------------------------------------------------
    # COMPACT ANSWER PROMPT
    # --------------------------------------------------

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
