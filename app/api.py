import threading

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import documents, chat


def _warm_up_models():
    try:
        print("[warm-up] Starting model warm-up in background...")
        import app.loaders.embeddings   # noqa: F401
        print("[warm-up] embeddings loaded")
        import app.loaders.reranking    # noqa: F401
        print("[warm-up] reranker loaded")
        import app.loaders.generation   # noqa: F401
        print("[warm-up] generation loaded")
        print("[warm-up] ✅ All models ready")
    except Exception as exc:
        print(f"[warm-up] ⚠️  Model loading failed: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    t = threading.Thread(target=_warm_up_models, daemon=True, name="model-warm-up")
    t.start()
    yield


app = FastAPI(
    title="Meiporul AI",
    description="AI-powered document question-answering system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration.  Keep this in sync with ``main.py``: some deployment
# providers import ``app.api:app`` instead of ``main:app``.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://meiporul-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Meiporul AI API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
