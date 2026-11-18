import re

def test_answer(llm_answer, prompt):
    try:
        response = llm_answer.invoke(prompt)
        answer = response.content

        meta = response.response_metadata or {}
        print("finish_reason:", meta.get("finish_reason"))
        print("token_usage:", meta.get("token_usage"))
        print("RAW LENGTH:", len(answer or ""))
        print("RAW END:", repr((answer or "")[-120:]))
        print("HAS CITATIONS:", bool(re.search(r"\[\d+\]", answer or "")))

        if not answer or not answer.strip():
            return (
                "The model did not generate an answer. "
                "Please try again."
            )

        return answer.strip()

    except Exception as error:
        print("Answer generation error:", str(error))
        return (
            "An error occurred while generating "
            "the answer. Please try again."
        )
