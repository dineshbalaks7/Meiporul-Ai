from app.querying import answer_question

def main():

    document_id = input("Enter document ID: ").strip()

    while True:

        query = input("\nAsk your question (exit to quit): ")

        if query.lower().strip() in ["exit", "quit"]:
            break

        if not query.strip():
            continue

        try:
            answer = answer_question(query, document_id)

            print("\nGenerated Answer:")
            print(answer)

        except Exception as e:
            print("\nError:", e)


if __name__ == "__main__":
    main()