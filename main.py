import os
import threading
import uvicorn

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import documents, chat


def _warm_up_models():
    """
    Load heavyweight ML models in a background thread so the port binds
    immediately (satisfying Railway / health checks) while models download.
    Import order matters: embeddings first (ChromaDB depends on them),
    then reranking, then generation.
    """
    try:
        print("[warm-up] Starting model warm-up in background...")
        import app.loaders.embeddings   # noqa: F401  ~90 MB
        print("[warm-up] embeddings loaded")
        import app.loaders.reranking    # noqa: F401  ~250 MB (CrossEncoder)
        print("[warm-up] reranker loaded")
        import app.loaders.generation   # noqa: F401  ChatGroq objects
        print("[warm-up] generation loaded")
        print("[warm-up] ✅ All models ready")
    except Exception as exc:
        print(f"[warm-up] ⚠️  Model loading failed: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start model loading in a daemon thread right after the port binds.
    t = threading.Thread(target=_warm_up_models, daemon=True, name="model-warm-up")
    t.start()
    yield
    # Nothing to clean up on shutdown.


app = FastAPI(
    title="Meiporul AI",
    description="AI-powered document assistant",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://meiporul-ai.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to Meiporul AI API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=False
    )