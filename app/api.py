from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import documents, chat

app = FastAPI(
    title="Meiporul AI",
    description="AI-powered document question-answering system",
    version="1.0.0"
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
