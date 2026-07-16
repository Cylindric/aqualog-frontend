import os
from pathlib import Path
from fastapi import FastAPI

app = FastAPI(
    title="aqualog-frontend-backend",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs"
)

FRONTEND_DIR = Path(os.getenv("FRONTEND_DIR", "/app/frontend"))

app.frontend("/", directory=FRONTEND_DIR, fallback="index.html")

def _runtime_config() -> dict[str, str]:
    return {
        key: value
        for key, value in os.environ.items()
        if key.startswith("AQUALOG_") and value is not None
    }

@app.get("/api/runtime-config")
def get_runtime_config() -> dict[str, str]:
    return _runtime_config()
