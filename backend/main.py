import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="aqualog-frontend-backend",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(os.getenv("FRONTEND_DIR", "/app/frontend"))

app.frontend("/", directory=FRONTEND_DIR, fallback="index.html")

def _runtime_config() -> dict[str, str]:
    # Only return the variables needed by the frontend, and filter out any that are not needed
    whitelist = [
        "AQUALOG_API_BASE_URL",
        "AQUALOG_AUTH_MODE",
        "AQUALOG_OAUTH_ISSUER_URL",
        "AQUALOG_OAUTH_CLIENT_ID",
        "AQUALOG_OIDC_REDIRECT_URI",
        "AQUALOG_OIDC_POST_LOGOUT_REDIRECT_URI",
        "AQUALOG_OAUTH_SCOPE",
        "AQUALOG_APP_VERSION",
    ]
    return {
        key: value
        for key, value in os.environ.items()
        if key in whitelist and value is not None
    }

@app.get("/api/runtime-config")
def get_runtime_config() -> dict[str, str]:
    return _runtime_config()

@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "version": os.getenv("AQUALOG_APP_VERSION", "unknown"),
    }
