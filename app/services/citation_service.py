import re

# Matches [1], [1, 2], [SOURCE 1], 【1】, 【1†L5-L7】
# \d{1,2} avoids touching things like [2024]
CITATION_PATTERN = re.compile(
    r"(?:\[|【)\s*(?:SOURCE\s*)?"
    r"(\d{1,2}(?:\s*[,;]\s*\d{1,2})*)"
    r"(?:[†:][^\]】]*)?\s*(?:\]|】)",
    re.IGNORECASE,
)


def normalize_citations(answer, sources):

    if not answer:
        return {"answer": answer or "", "sources": []}

    total = len(sources)
    cited_ids = set()

    def replace(match):
        ids = []

        for number in re.findall(r"\d+", match.group(1)):
            n = int(number)
            if 1 <= n <= total and n not in ids:
                ids.append(n)

        if not ids:
            return ""  # drop invalid citations

        cited_ids.update(ids)
        return "".join(f"[{n}]" for n in sorted(ids))

    answer = CITATION_PATTERN.sub(replace, answer)

    # Space before a citation that follows a word or punctuation,
    # but not between adjacent citations like [1][2]
    answer = re.sub(r"(?<=[\w.,;:)])(\[\d+\])", r" \1", answer)

    # No space before punctuation (left behind by removed citations)
    answer = re.sub(r"[ \t]+([.,;:])", r"\1", answer)

    return {
        "answer": answer.strip(),
        "sources": [
            {"source_id": index, **source}
            for index, source in enumerate(sources, start=1)
            if index in cited_ids
        ],
    }