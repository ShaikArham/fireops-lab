import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import install_routes

app = FastAPI(
    title="FireOps Lab API",
    description=(
        "Independent fictional-data payment operations simulator. "
        "It does not move money or make real fraud or AML decisions."
    ),
    version="0.1.0",
)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "FIREOPS_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "fireops-api"}


install_routes(app)
