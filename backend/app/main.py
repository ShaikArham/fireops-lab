from fastapi import FastAPI

app = FastAPI(
    title="FireOps Lab API",
    description=(
        "Phase 1 API skeleton for an independent fictional-data portfolio project. "
        "No payment or monitoring features are implemented yet."
    ),
    version="0.1.0",
)


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "fireops-api"}

