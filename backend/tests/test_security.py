import csv
import io

import pytest
from fastapi.testclient import TestClient

from app.main import app, parse_cors_origins
from app.services.operational_insights import report_csv


@pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
def test_api_mutations_are_disabled_by_default(
    method: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("FIREOPS_ENV", "production")
    monkeypatch.delenv("FIREOPS_ENABLE_DEMO_WRITES", raising=False)

    with TestClient(app) as client:
        assert client.get("/health").status_code == 200
        response = client.request(
            method,
            "/api/v1/source-files/preview?kind=payment_instructions",
            content=b"untrusted body",
        )

    assert response.status_code == 503
    assert response.json()["detail"] == "Demo API writes are disabled outside local development."


def test_demo_mutations_require_explicit_local_development_opt_in(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("FIREOPS_ENV", "production")
    monkeypatch.setenv("FIREOPS_ENABLE_DEMO_WRITES", "true")

    with TestClient(app) as client:
        response = client.request(
            "PATCH",
            "/api/v1/source-files/preview?kind=payment_instructions",
            content=b"untrusted body",
        )

    assert response.status_code == 503


def test_cors_allows_only_explicit_origins() -> None:
    with TestClient(app) as client:
        allowed = client.options(
            "/api/v1/source-files/preview?kind=payment_instructions",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        rejected = client.options(
            "/api/v1/source-files/preview?kind=payment_instructions",
            headers={
                "Origin": "https://attacker.example",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "access-control-allow-origin" not in rejected.headers


def test_cors_configuration_rejects_wildcards_malformed_and_insecure_production_origins() -> None:
    with pytest.raises(ValueError, match="Wildcard"):
        parse_cors_origins("https://example.com,*")
    with pytest.raises(ValueError, match="Invalid CORS origin"):
        parse_cors_origins("https://example.com/path")
    with pytest.raises(ValueError, match="Invalid CORS origin"):
        parse_cors_origins("https://user@example.com")
    with pytest.raises(ValueError, match="Invalid CORS origin"):
        parse_cors_origins("https://example.com:invalid")
    with pytest.raises(ValueError, match="must use HTTPS"):
        parse_cors_origins("http://example.com", require_https=True)
    assert parse_cors_origins("https://example.com", require_https=True) == [
        "https://example.com"
    ]


def test_report_csv_neutralizes_formula_like_text() -> None:
    report = {
        "metrics": {"example": "=HYPERLINK(\"https://attacker.example\")"},
        "definitions": {
            "example": "@SUM(A1:A2)",
            "root_cause_distribution": "Root cause counts.",
            "reconciliation_run_trend": "Run trend.",
        },
        "exception_categories": [],
        "root_cause_distribution": [],
        "reconciliation_run_trend": [
            {"run_id": "-1+2", "exact_match_rate_pct": 10, "exception_result_count": 1}
        ],
        "recurring_exception_patterns": [],
        "improvement_exercise": {
            "label": "+SUM(1,1)",
            "exception_review_items": 1,
            "basis": "safe assumption",
        },
    }

    rows = list(csv.reader(io.StringIO(report_csv(report))))
    flattened = [cell for row in rows for cell in row]

    assert "'=HYPERLINK(\"https://attacker.example\")" in flattened
    assert "'@SUM(A1:A2)" in flattened
    assert "'-1+2" in flattened
    assert "'+SUM(1,1)" in flattened
    assert not any(cell.startswith(("=", "+", "-", "@")) for cell in flattened)
