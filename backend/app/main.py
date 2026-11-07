from fastapi import FastAPI

app = FastAPI(
    title="FireOps Lab API",
    description=(
        "Phase 2 source-data foundation for an independent fictional-data portfolio project. "
        "CSV validation is available as a Python service; "
        "import and payment workflows are not exposed yet."
    ),
    version="0.1.0",
)


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "fireops-api"}
