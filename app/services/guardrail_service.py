import re

# ==================================================
# 1. PROMPT INJECTION & JAILBREAK PATTERNS
# ==================================================

PROMPT_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions", re.IGNORECASE),
    re.compile(r"disregard\s+(?:all\s+)?(?:previous|prior|above)\s+instructions", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(?:dan|jailbreak|unrestricted|god\s*mode|omega)", re.IGNORECASE),
    re.compile(r"(?:print|reveal|show|display|output)\s+(?:the\s+)?(?:system\s+prompt|initial\s+instructions|system\s+instructions)", re.IGNORECASE),
    re.compile(r"bypass\s+(?:all\s+)?(?:safety|guardrails?|restrictions?|filters?)", re.IGNORECASE),
    re.compile(r"act\s+as\s+(?:an?\s+)?unfiltered\s+(?:ai|llm|assistant)", re.IGNORECASE),
    re.compile(r"do\s+anything\s+now", re.IGNORECASE),
    re.compile(r"repeat\s+the\s+words\s+above", re.IGNORECASE),
]

# ==================================================
# 2. PII & SECRET PATTERNS
# ==================================================

# Matches typical OpenAI/Groq API keys, GitHub tokens, AWS keys
SECRET_PATTERNS = [
    re.compile(r"\b(gsk_[A-Za-z0-9]{40,})\b"),           # Groq key
    re.compile(r"\b(sk-[A-Za-z0-9]{32,})\b"),            # OpenAI key
    re.compile(r"\b(ghp_[A-Za-z0-9]{36})\b"),            # GitHub PAT
    re.compile(r"\b(AKIA[0-9A-Z]{16})\b"),               # AWS Access Key
]

# Credit card regex (Visa, MasterCard, Amex, Discover)
CREDIT_CARD_PATTERN = re.compile(
    r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b"
)

# ==================================================
# 3. OUT-OF-SCOPE GENERAL TASK PATTERNS
# Meiporul AI is exclusively for document intelligence.
# General requests for coding, email drafting, recipes,
# essays, or creative tasks must be politely declined.
# ==================================================

CODING_PATTERNS = [
    re.compile(r"\b(?:write|create|generate|provide|give\s+me)\s+(?:a\s+|the\s+)?(?:python|javascript|typescript|java|c\+\+|c#|php|ruby|golang|go|rust|sql|html|css|bash|shell)\s+(?:code|script|program|function|query|class|loop)\b", re.IGNORECASE),
    re.compile(r"\b(?:write|code|create)\s+(?:a\s+|an\s+)?(?:script|function|program|loop|class|regex|algorithm|api|endpoint|database\s+schema)\b", re.IGNORECASE),
    re.compile(r"\b(?:debug|fix|refactor|optimize)\s+(?:this\s+|my\s+)?(?:code|script|error|function|bug|traceback)\b", re.IGNORECASE),
    re.compile(r"\bhow\s+to\s+(?:code|program|build\s+an?\s+app|implement)\b", re.IGNORECASE),
    re.compile(r"^```[a-z]*\s*[\r\n]+", re.IGNORECASE), # Raw code block submission
]

EMAIL_DRAFTING_PATTERNS = [
    re.compile(r"\b(?:write|draft|compose|create)\s+(?:an?\s+)?(?:email|e-mail|mail|letter|message|memo)\s+(?:to|for|about|asking|requesting|declining)\b", re.IGNORECASE),
    re.compile(r"\b(?:write|draft|compose)\s+(?:an?\s+)?(?:resignation\s+letter|cover\s+letter|leave\s+application|formal\s+letter|apology\s+letter|complaint\s+letter)\b", re.IGNORECASE),
    re.compile(r"\bwrite\s+(?:an?\s+)?email\b", re.IGNORECASE),
    re.compile(r"\bdraft\s+(?:an?\s+)?email\b", re.IGNORECASE),
]

CREATIVE_WRITING_PATTERNS = [
    re.compile(r"\b(?:write|compose|create)\s+(?:an?\s+)?(?:essay|poem|poetry|song|lyrics|story|fairytale|novel|joke|riddle|script|screenplay|speech|blog\s*post|article)\b", re.IGNORECASE),
    re.compile(r"\btell\s+me\s+a\s+(?:story|joke|fairy\s*tale|riddle)\b", re.IGNORECASE),
]

GENERIC_TUTORIAL_PATTERNS = [
    re.compile(r"\b(?:recipe|ingredients|how\s+to\s+bake|how\s+to\s+cook|how\s+to\s+make)\s+(?:a\s+|an\s+)?(?:cake|dish|curry|bread|pasta|pizza|coffee|tea|cocktail|food|soup|cookie|meal)\b", re.IGNORECASE),
    re.compile(r"\b(?:workout|diet|exercise)\s+(?:plan|routine|regime|chart)\b", re.IGNORECASE),
    re.compile(r"\bhow\s+to\s+(?:lose|gain)\s+weight\b", re.IGNORECASE),
    re.compile(r"\bhoroscope|astrology|tarot|fortune\s*telling\b", re.IGNORECASE),
]


# ==================================================
# GUARDRAIL FUNCTIONS
# ==================================================

def check_prompt_injection(query: str) -> dict:
    """Inspect query for adversarial prompt injection or jailbreak attempts."""
    if not isinstance(query, str):
        return {"violated": False}

    text = query.strip()
    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(text):
            return {
                "violated": True,
                "reason": "prompt_injection",
                "message": (
                    "I cannot fulfill requests that attempt to modify system instructions "
                    "or bypass security boundaries. I am here to help you search, summarize, "
                    "and analyze your documents."
                ),
            }

    return {"violated": False}


def sanitize_pii(text: str) -> str:
    """Mask sensitive secrets and credit card numbers."""
    if not isinstance(text, str):
        return text

    sanitized = text

    # Mask credit card numbers
    sanitized = CREDIT_CARD_PATTERN.sub("[REDACTED_PAYMENT_CARD]", sanitized)

    # Mask API keys
    for pattern in SECRET_PATTERNS:
        sanitized = pattern.sub("[REDACTED_API_KEY]", sanitized)

    return sanitized


def check_general_scope(query: str) -> dict:
    """
    Ensure general responses remain strictly minimal (greetings, simple app info, date/time).
    Declines coding, email composition, creative writing, and unrelated generic tutorials.
    """
    if not isinstance(query, str):
        return {"violated": False}

    text = query.strip()

    # 1. Coding requests
    for pattern in CODING_PATTERNS:
        if pattern.search(text):
            return {
                "violated": True,
                "reason": "coding_out_of_scope",
                "message": (
                    "I am **Meiporul AI**, a document intelligence assistant. "
                    "I do not write, debug, or generate programming code. "
                    "Please upload or select a document to analyze its content or answer questions from it!"
                ),
            }

    # 2. Email / letter composition
    for pattern in EMAIL_DRAFTING_PATTERNS:
        if pattern.search(text):
            return {
                "violated": True,
                "reason": "email_out_of_scope",
                "message": (
                    "I am **Meiporul AI**, a document intelligence assistant. "
                    "I do not draft emails, letters, or personal correspondence. "
                    "If you have documents such as company guidelines or templates, please upload them and I can extract or verify their details for you!"
                ),
            }

    # 3. Creative writing / stories / jokes
    for pattern in CREATIVE_WRITING_PATTERNS:
        if pattern.search(text):
            return {
                "violated": True,
                "reason": "creative_out_of_scope",
                "message": (
                    "I am **Meiporul AI**, designed specifically for grounded document analysis. "
                    "I do not write creative essays, poems, or stories. "
                    "Please upload or select a document to explore and summarize its facts."
                ),
            }

    # 4. Generic tutorials / cooking / diets
    for pattern in GENERIC_TUTORIAL_PATTERNS:
        if pattern.search(text):
            return {
                "violated": True,
                "reason": "lifestyle_out_of_scope",
                "message": (
                    "I am **Meiporul AI**, an AI assistant focused strictly on document intelligence. "
                    "I don't provide cooking recipes, workout plans, or generic external tutorials. "
                    "Please upload a document to ask questions based on its content!"
                ),
            }

    return {"violated": False}


def apply_output_guardrails(answer: str, sources: list = None) -> dict:
    """
    Sanitize and enforce output constraints:
    - Mask any sensitive credentials/cards.
    - If answer is a refusal, guarantee sources is empty.
    - Ensure clean formatting.
    """
    if not isinstance(answer, str):
        answer = str(answer or "")

    sources = sources or []

    # 1. Sanitize any potential PII or leaked secrets
    clean_answer = sanitize_pii(answer.strip())

    # 2. Refusal signals check: if the answer is a refusal or guardrail notice, clear sources
    refusal_signals = [
        "does not contain information to answer this question",
        "i do not write, debug, or generate programming code",
        "i do not draft emails",
        "i do not write creative essays",
        "i don't provide cooking recipes",
        "i cannot fulfill requests that attempt to modify system instructions",
        "the selected document does not contain information",
    ]

    is_refusal = any(sig in clean_answer.lower() for sig in refusal_signals)
    if is_refusal:
        sources = []

    return {
        "answer": clean_answer,
        "sources": sources,
    }
