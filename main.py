import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import documents, chat

app = FastAPI(
    title="Meiporul AI",
    description="AI-powered document assistant",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://meiporul-ai.vercel.app",
        "https://meiporul-ai.vercel.app/",
        "*",
    ],
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
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
