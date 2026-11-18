from fastapi import FastAPI

app = FastAPI(
    title="Meiporul AI",
    description="AI-powered document assistant",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "Welcome to Meiporul AI API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}