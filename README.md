# Meiporul AI

**Meiporul AI** is an intelligent, document-grounded question-answering assistant and general conversational AI. Built on **FastAPI**, **LangChain**, **Groq (Llama 3.3)**, **ChromaDB**, and a modern **React + Vite + TypeScript** interface, Meiporul AI delivers reliable answers with verifiable page citations, semantic reranking, and an editorial design system.

---

## Features

- **Dual-Mode Intelligence**:
  - **General AI Mode**: Brainstorm ideas, draft content, debug code, and explore complex topics.
  - **Document Intelligence (RAG)**: Ask deep questions across indexed PDFs, DOCX, and TXT files with precise context grounding.
- **Verifiable Page Citations (`[n]`)**:
  - Interactive `[n]` citations linked directly to page numbers and document source chunks.
  - Click any citation to smoothly scroll and highlight the exact corresponding source card.
  - Hover popover previews with document titles, page tags, and content snippets.
- **Horizontal Source Scroll Track**:
  - Horizontal carousel of source cards with smooth touch-panning and quick scroll navigation.
- **Full Document Management**:
  - Upload, index, filter, search, and delete PDF, DOCX, and TXT files.
  - Integrated ChromaDB vector store with chunk count statistics.
- **Modern Message Interaction**:
  - Inline user prompt editing with automatic chat rollback and re-submission.
  - One-click copy for user questions and assistant answers.
  - Thumbs up/down feedback and retry options.
  - Formatted markdown tables, code syntax highlighting, and responsive typography.
- **Mobile-Native Alignment**:
  - Optimized for mobile viewports using dynamic viewport units (`100dvh`), `viewport-fit=cover`, and safe-area insets.
  - `touch-action: manipulation` for instant tap response without delay.
  - Enforced 16px font sizes on touch viewports to eliminate iOS Safari auto-zoom.
- **Warm Editorial Aesthetic**:
  - Warm ivory canvas (`#FCFAF7`), terracotta accents (`#9E4A25`), and fluid spring animations via Framer Motion.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, React Markdown, Remark GFM
- **Backend**: Python 3.10+, FastAPI, Uvicorn, LangChain, SQLite
- **LLM Inference**: Groq API
- **Embeddings & Vector Store**: HuggingFace / SentenceTransformers, ChromaDB
- **Document Loaders**: PyPDF, python-docx, text loaders

---

## Getting Started

### Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: v18 or higher (with npm)
- **Groq API Key**: Obtain an API key from Groq Console

---

### 1. Configure Environment Variables

Copy the template file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your actual Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

### 2. Backend Setup

Create and activate a Python virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend server:

```bash
python main.py
```

The API will start at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup

In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

The frontend development server will launch at `http://localhost:5173`.

To create a production build:

```bash
npm run build
```

---

## Project Structure

```
DocuMind-Ai/
├── app/
│   ├── api.py                    # FastAPI route declarations & request handlers
│   ├── querying.py               # RAG question answering pipeline & synthesis
│   ├── retrieval.py              # Hybrid retrieval & Chroma query logic
│   ├── reranker.py               # Semantic cross-encoder reranking
│   ├── loaders/
│   │   ├── generation.py         # Groq LLM setup, routing & system prompts
│   │   ├── models.py             # Embedding models configuration
│   │   └── vector_store.py       # ChromaDB client & vector store helpers
│   └── services/
│       ├── document_manager.py   # Document ingestion, parsing & chunking
│       └── retrieval_service.py  # Retrieval orchestration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/             # ChatWindow, ChatInput, ChatMessage, AnswerView
│   │   │   ├── documents/        # DocumentList, DocumentUpload, DocumentCard
│   │   │   ├── layout/           # AppLayout, Header, Sidebar, MobileSidebar
│   │   │   ├── sources/          # SourcePreview slide-over drawer
│   │   │   └── ui/               # Button, Dialog, Dropdown, Toast, ErrorBoundary
│   │   ├── hooks/                # useChat, useConversations, useDocuments, useUserProfile
│   │   ├── types/                # TypeScript interfaces for Chat, Documents, etc.
│   │   ├── index.css             # Tailwind base styles, typography & motion tokens
│   │   └── App.tsx               # Root application entry
│   ├── index.html                # HTML template with mobile viewport configuration
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── uploads/                  # Uploaded document staging (git-ignored)
├── chroma_db/                    # Chroma vector database files (git-ignored)
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore specifications
├── requirements.txt              # Python dependencies
├── main.py                       # Backend server entrypoint
└── README.md                     # Project documentation
```
