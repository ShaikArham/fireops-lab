"""Production-mode integration checks against a dedicated PostgreSQL test database."""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db.session import database_engine
from app.demo import COOKIE, checked_schema, registry, sessions, token_hash
from app.main import app


@pytest.fixture
def isolated_clients(monkeypatch):
    url = os.getenv("FIREOPS_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Set FIREOPS_TEST_DATABASE_URL to a dedicated PostgreSQL test database")
    monkeypatch.setenv("DATABASE_URL", url)
    monkeypatch.setenv("FIREOPS_ISOLATED_DEMO", "true")
    monkeypatch.setenv("FIREOPS_ENV", "production")
    engine = database_engine()
    registry.create_all(engine)
    clients = [
        TestClient(app, base_url="https://testserver", headers={"X-FireOps-Demo": "1"})
        for _ in range(2)
    ]
    try:
        yield clients
    finally:
        with engine.begin() as conn:
            for client in clients:
                token = client.cookies.get(COOKIE)
                if not token:
                    continue
                row = (
                    conn.execute(
                        sessions.select().where(sessions.c.token_hash == token_hash(token))
                    )
                    .mappings()
                    .first()
                )
                if row:
                    name = checked_schema(row["schema_name"])
                    conn.execute(text(f'DROP SCHEMA "{name}" CASCADE'))
                    conn.execute(
                        sessions.delete().where(sessions.c.token_hash == row["token_hash"])
                    )
                client.close()


def start(client):
    response = client.post("/api/v1/demo/session")
    assert response.status_code == 200, response.text
    return response


def test_isolation_persistence_and_reset(isolated_clients):
    a, b = isolated_clients
    response = start(a)
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "Secure" in response.headers["set-cookie"]
    start(b)
    assert a.post("/api/v1/demo/load").status_code == 200
    own = a.get("/api/v1/batches").json()
    assert own["batches"]
    assert b.get("/api/v1/batches").json()["batches"] == []
    assert start(a).json()["reused"] is True
    assert a.get("/api/v1/batches").json() == own
    assert a.post("/api/v1/demo/load").json()["imported_count"] == 0
    assert b.post("/api/v1/demo/load").status_code == 200
    assert a.post("/api/v1/demo/reset").status_code == 200
    assert a.get("/api/v1/batches").json()["batches"] == []
    assert b.get("/api/v1/batches").json()["batches"]


def test_csrf_unauthenticated_and_forged_cookie(isolated_clients):
    a, _ = isolated_clients
    assert a.get("/api/v1/batches").status_code == 401
    assert a.post("/api/v1/demo/session", headers={"X-FireOps-Demo": ""}).status_code == 403
    assert (
        a.post("/api/v1/demo/session", headers={"Origin": "https://evil.test"}).status_code == 403
    )
    a.cookies.set(COOKIE, "forged")
    assert a.get("/api/v1/batches").status_code == 401
    a.cookies.clear()
    start(a)
    assert a.get("/api/v1/batches").headers["cache-control"] == "private, no-store"


def test_known_foreign_ids_are_inaccessible(isolated_clients):
    a, b = isolated_clients
    start(a)
    start(b)
    assert a.post("/api/v1/demo/load").status_code == 200
    batches = a.get("/api/v1/batches").json()
    batch = batches["batches"][0]["batch_id"]
    response = b.post(f"/api/v1/batches/{batch}/simulate", json={})
    assert response.status_code == 404
    run = a.post(
        "/api/v1/reconciliation/runs",
        json={
            "payment_batch_id": batch,
            "settlement_batch_id": batches["settlement_batches"][0]["settlement_batch_id"],
        },
    )
    assert run.status_code == 201, run.text
    run_id = run.json()["run_id"]
    assert b.get(f"/api/v1/reconciliation/runs/{run_id}").status_code == 404


def test_rate_limit_and_expiry(isolated_clients):
    a, _ = isolated_clients
    start(a)
    digest = token_hash(a.cookies.get(COOKIE))
    with database_engine().begin() as conn:
        conn.execute(
            sessions.update().where(sessions.c.token_hash == digest).values(total_writes=300)
        )
    assert a.post("/api/v1/demo/reset").status_code == 429
    with database_engine().begin() as conn:
        conn.execute(sessions.update().where(sessions.c.token_hash == digest).values(expires_at=0))
    assert a.get("/api/v1/batches").status_code == 401


def test_explicit_trusted_preview_origins(isolated_clients, monkeypatch):
    a, _ = isolated_clients
    trusted = "https://fireops-workspace-preview.example,https://fireops-workspace-stable.example"
    monkeypatch.setenv("FIREOPS_PUBLIC_ORIGIN", trusted)
    blocked = a.post("/api/v1/demo/session", headers={"Origin": "https://evil.example"})
    assert blocked.status_code == 403
    allowed = a.post(
        "/api/v1/demo/session",
        headers={"Origin": "https://fireops-workspace-preview.example"},
    )
    assert allowed.status_code == 200, allowed.text
    assert a.post(
        "/api/v1/demo/load",
        headers={"Origin": "https://fireops-workspace-stable.example"},
    ).status_code == 200
    assert a.post(
        "/api/v1/demo/reset",
        headers={"Origin": "https://evil.example"},
    ).status_code == 403
