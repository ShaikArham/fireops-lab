"""Bounded synthetic workspaces isolated by PostgreSQL schema and opaque cookies."""

import hashlib
import os
import re
import secrets
import time
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import Column, Integer, MetaData, String, Table, delete, func, select, text
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import database_engine, get_session
from app.models import ExceptionCase, ReconciliationResult, ReconciliationRun
from app.services.case_management import create_case
from app.services.monitoring_operations import run_monitoring
from app.services.payment_operations import import_source_file
from app.services.reconciliation_operations import run_reconciliation

COOKIE = "fireops_demo"
TTL = 86400
SCHEMA_VERSION = 1
registry = MetaData(schema="public")
sessions = Table(
    "fireops_demo_sessions",
    registry,
    Column("token_hash", String(64), primary_key=True),
    Column("schema_name", String(64), nullable=False, unique=True),
    Column("created_at", Integer, nullable=False),
    Column("expires_at", Integer, nullable=False),
    Column("window", Integer, nullable=False),
    Column("requests", Integer, nullable=False),
    Column("writes", Integer, nullable=False),
    Column("total_writes", Integer, nullable=False),
    Column("version", Integer, nullable=False),
)
router = APIRouter(prefix="/api/v1/demo", tags=["isolated demo"])


def enabled() -> bool:
    return os.getenv("FIREOPS_ISOLATED_DEMO", "false").lower() == "true"


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def checked_schema(value: str) -> str:
    if not re.fullmatch(r"demo_[a-f0-9]{32}", value):
        raise ValueError("Invalid workspace schema")
    return value


def authenticate(request: Request, *, write: bool) -> str:
    authorization = request.headers.get("authorization", "")
    token = authorization.removeprefix("Bearer ").strip() if authorization.startswith("Bearer ") else request.cookies.get(COOKIE, "")
    if not re.fullmatch(r"[A-Za-z0-9_-]{43}", token):
        raise HTTPException(401, "Start your demo workspace first.")
    now = int(time.time())
    with database_engine().begin() as conn:
        row = (
            conn.execute(
                select(sessions).where(sessions.c.token_hash == token_hash(token)).with_for_update()
            )
            .mappings()
            .first()
        )
        if not row or row["expires_at"] <= now:
            raise HTTPException(401, "Your demo expired. Start a new workspace.")
        if row["version"] != SCHEMA_VERSION:
            raise HTTPException(409, "This demo version expired. Start a new workspace.")
        same_window = row["window"] == now // 60
        count = row["requests"] if same_window else 0
        writes = row["writes"] if same_window else 0
        if count >= 120 or (write and (writes >= 30 or row["total_writes"] >= 300)):
            raise HTTPException(
                429, "Demo request limit reached. Try again later.", headers={"Retry-After": "60"}
            )
        conn.execute(
            sessions.update()
            .where(sessions.c.token_hash == row["token_hash"])
            .values(
                window=now // 60,
                requests=count + 1,
                writes=writes + int(write),
                total_writes=row["total_writes"] + int(write),
            )
        )
        return checked_schema(row["schema_name"])


def require_browser_write(request: Request) -> None:
    if request.headers.get("x-fireops-demo") != "1":
        raise HTTPException(403, "Missing demo request header.")
    origin = request.headers.get("origin")
    configured = os.getenv("FIREOPS_PUBLIC_ORIGIN", "")
    allowed_origins = {
        value.strip().rstrip("/") for value in configured.split(",") if value.strip()
    }
    if not allowed_origins:
        allowed_origins = {f"{request.url.scheme}://{request.url.netloc}"}
    # Vercel gives every deployment a new hostname. Accept only deployment aliases
    # belonging to this exact frontend project and account, never arbitrary origins.
    trusted_preview = bool(
        origin
        and re.fullmatch(
            r"https://fireops-workspace-preview-[a-z0-9]{9}(?:-shaikarhamsaquib1188113-7684)?\.vercel\.app",
            origin.rstrip("/"),
        )
    )
    if origin and origin.rstrip("/") not in allowed_origins and not trusted_preview:
        raise HTTPException(403, "Cross-origin demo writes are not allowed.")
    # A cross-site browser request is permitted only from an explicitly configured
    # origin and must still carry the demo header and a valid workspace token.
    if request.headers.get("sec-fetch-site") == "cross-site" and not origin:
        raise HTTPException(403, "Missing origin for cross-site demo write.")


@router.post("/session")
def start_demo(request: Request, response: Response) -> dict[str, object]:
    if not enabled():
        raise HTTPException(503, "Isolated demo is not configured.")
    require_browser_write(request)
    if request.cookies.get(COOKIE) or request.headers.get("authorization", "").startswith("Bearer "):
        try:
            authenticate(request, write=False)
            return {"status": "ready", "expires_in_hours": 24, "reused": True}
        except HTTPException as exc:
            if exc.status_code not in (401, 409):
                raise
    engine = database_engine()
    if engine.dialect.name != "postgresql":
        raise HTTPException(503, "Isolated demos require PostgreSQL.")
    now = int(time.time())
    token = secrets.token_urlsafe(32)
    schema = "demo_" + secrets.token_hex(16)
    with engine.begin() as conn:
        conn.execute(text("SELECT pg_advisory_xact_lock(70438101)"))
        expired = conn.execute(select(sessions).where(sessions.c.expires_at <= now)).mappings()
        for old in list(expired):
            name = checked_schema(old["schema_name"])
            conn.execute(
                text("SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))"), {"key": name}
            )
            conn.execute(text(f'DROP SCHEMA IF EXISTS "{name}" CASCADE'))
            conn.execute(delete(sessions).where(sessions.c.token_hash == old["token_hash"]))
        count = conn.scalar(select(func.count()).select_from(sessions)) or 0
        recent = (
            conn.scalar(
                select(func.count()).select_from(sessions).where(sessions.c.created_at > now - 60)
            )
            or 0
        )
        if count >= 20 or recent >= 5:
            raise HTTPException(
                429,
                "The demo is at capacity. Please try again later.",
                headers={"Retry-After": "60"},
            )
        conn.execute(text(f'CREATE SCHEMA "{schema}"'))
        scoped = conn.execution_options(schema_translate_map={None: schema})
        Base.metadata.create_all(scoped)
        conn.execute(
            sessions.insert().values(
                token_hash=token_hash(token),
                schema_name=schema,
                created_at=now,
                expires_at=now + TTL,
                window=now // 60,
                requests=1,
                writes=0,
                total_writes=0,
                version=SCHEMA_VERSION,
            )
        )
    # For a cross-origin GitHub Pages client, return an opaque token to the
    # browser instead of relying on third-party cookies. Never log this token.
    browser_origin = request.headers.get("origin", "").rstrip("/")
    cross_origin = bool(browser_origin and browser_origin != f"{request.url.scheme}://{request.url.netloc}")
    response.set_cookie(
        COOKIE,
        token,
        max_age=TTL,
        httponly=True,
        samesite="strict",
        secure=os.getenv("FIREOPS_ENV") != "development",
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"
    payload = {"status": "ready", "expires_in_hours": 24, "reused": False}
    if cross_origin:
        payload["access_token"] = token
    return payload


@router.get("/session")
def demo_status(request: Request) -> dict[str, object]:
    return {"status": "ready", "isolated": bool(getattr(request.state, "demo_schema", None))}


@router.post("/load")
def load_demo(session: Annotated[Session, Depends(get_session)]) -> dict[str, object]:
    root = Path(__file__).parent / "fixtures"
    imported = 0
    for scenario in ("normal_day", "exception_day"):
        for kind in ("payment_instructions", "settlement_records"):
            path = root / scenario / f"{kind}.csv"
            result = import_source_file(
                session, file_name=f"{scenario}-{kind}.csv", content=path.read_bytes(), kind=kind
            )
            imported += result.imported_count
    # Prepare a deterministic guided journey once per isolated workspace.
    scenarios = (
        ("BATCH-N-20261014", "SETTLE-N-20261015"),
        ("BATCH-E-20261015", "SETTLE-E-20261016"),
    )
    prepared = []
    for payment_batch, settlement_batch in scenarios:
        existing = session.scalar(select(ReconciliationRun).where(
            ReconciliationRun.payment_batch_id == payment_batch,
            ReconciliationRun.settlement_batch_id == settlement_batch,
        ).order_by(ReconciliationRun.finished_at.desc()).limit(1))
        if existing is None:
            result = run_reconciliation(session, payment_batch, settlement_batch, 3)
            run_id = str(result["run_id"])
        else:
            run_id = existing.run_id
        exceptions = session.scalars(select(ReconciliationResult).where(
            ReconciliationResult.run_id == run_id,
            ReconciliationResult.classification.notin_(("MATCHED_EXACT", "MATCHED_LATE")),
        ).order_by(ReconciliationResult.result_id).limit(8)).all()
        for exception in exceptions:
            existing_case = session.scalar(
                select(ExceptionCase).where(ExceptionCase.result_id == exception.result_id)
            )
            if existing_case is None:
                create_case(session, exception.result_id, "system:demo-seed", "NORMAL")
        session.commit()
        run_monitoring(session, payment_batch, "system:demo-seed")
        session.commit()
        prepared.append({"payment_batch": payment_batch, "reconciliation_run": run_id})
    return {
        "prepared": prepared,
        "status": "loaded",
        "imported_count": imported,
        "message": "Normal and exception days loaded into your workspace.",
    }


@router.get("/scenarios")
def prepared_scenarios(session: Annotated[Session, Depends(get_session)]) -> dict[str, object]:
    """Return saved run identifiers, never create duplicate runs on read."""
    result = []
    for payment_batch, settlement_batch in (
        ("BATCH-N-20261014", "SETTLE-N-20261015"),
        ("BATCH-E-20261015", "SETTLE-E-20261016"),
    ):
        run = session.scalar(
            select(ReconciliationRun)
            .where(
                ReconciliationRun.payment_batch_id == payment_batch,
                ReconciliationRun.settlement_batch_id == settlement_batch,
            )
            .order_by(ReconciliationRun.finished_at.desc())
            .limit(1)
        )
        result.append({
            "payment_batch_id": payment_batch,
            "settlement_batch_id": settlement_batch,
            "reconciliation_run_id": run.run_id if run else None,
        })
    return {"scenarios": result}


@router.post("/reset")
def reset_demo(session: Annotated[Session, Depends(get_session)]) -> dict[str, str]:
    for table in reversed(Base.metadata.sorted_tables):
        session.execute(table.delete())
    session.commit()
    return {"status": "reset", "message": "Only your demo records were cleared."}
