import os
from urllib.parse import urlsplit

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import install_routes

DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"
MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def parse_cors_origins(raw: str, *, require_https: bool = False) -> list[str]:
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    if not origins:
        raise ValueError("FIREOPS_CORS_ORIGINS must contain at least one explicit origin.")

    for origin in origins:
        if origin == "*":
            raise ValueError("Wildcard CORS origins are not allowed.")
        parsed = urlsplit(origin)
        try:
            port = parsed.port
        except ValueError as error:
            raise ValueError(f"Invalid CORS origin: {origin!r}.") from error
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
            or "@" in parsed.netloc
            or parsed.path != ""
            or parsed.query
            or parsed.fragment
            or (port is not None and not 1 <= port <= 65535)
        ):
            raise ValueError(f"Invalid CORS origin: {origin!r}.")
        if require_https and parsed.scheme != "https":
            raise ValueError("Production CORS origins must use HTTPS.")

    return origins


runtime_mode = os.getenv("FIREOPS_ENV", "production").strip().lower()
cors_configured = "FIREOPS_CORS_ORIGINS" in os.environ
cors_origins = parse_cors_origins(
    os.getenv("FIREOPS_CORS_ORIGINS", DEFAULT_CORS_ORIGINS),
    require_https=runtime_mode != "development" and cors_configured,
)


app = FastAPI(
    title="FireOps Lab API",
    description=(
        "Independent fictional-data payment operations simulator. "
        "It does not move money or make real fraud or AML decisions."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def block_nonlocal_mutations(request: Request, call_next):
    is_api_write = request.url.path.startswith("/api/v1/") and request.method in MUTATING_METHODS
    local_write_opt_in = (
        os.getenv("FIREOPS_ENV", "production").strip().lower() == "development"
        and os.getenv("FIREOPS_ENABLE_DEMO_WRITES", "false").strip().lower() == "true"
    )
    if is_api_write and not local_write_opt_in:
        return JSONResponse(
            status_code=503,
            content={"detail": "Demo API writes are disabled outside local development."},
        )
    return await call_next(request)


@app.get("/health", tags=["operations"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "fireops-api"}


install_routes(app)
