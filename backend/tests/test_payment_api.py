from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
NORMAL_PAYMENTS = PROJECT_ROOT / "data/synthetic/normal_day/payment_instructions.csv"
NORMAL_SETTLEMENTS = PROJECT_ROOT / "data/synthetic/normal_day/settlement_records.csv"
EXCEPTION_PAYMENTS = PROJECT_ROOT / "data/synthetic/exception_day/payment_instructions.csv"
EXCEPTION_SETTLEMENTS = PROJECT_ROOT / "data/synthetic/exception_day/settlement_records.csv"


def test_api_previews_source_without_persisting_records(api_client) -> None:
    response = api_client.post(
        "/api/v1/source-files/preview?kind=payment_instructions",
        content=NORMAL_PAYMENTS.read_bytes(),
        headers={"content-type": "text/csv"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["is_valid"]
    assert body["data_row_count"] == 100
    assert len(body["preview"]) == 25
    assert body["preview_limit"] == 25


def test_api_import_batch_transition_history_and_simulation_are_connected(api_client) -> None:
    content = NORMAL_PAYMENTS.read_bytes()
    imported = api_client.post(
        "/api/v1/source-files/import/payment_instructions?file_name=normal.csv",
        content=content,
        headers={"content-type": "text/csv"},
    )
    replay = api_client.post(
        "/api/v1/source-files/import/payment_instructions?file_name=renamed.csv",
        content=content,
        headers={"content-type": "text/csv"},
    )

    assert imported.status_code == 200
    assert imported.json()["imported_count"] == 100
    assert not imported.json()["idempotent"]
    assert replay.json()["idempotent"]
    assert replay.json()["imported_count"] == 0

    batches = api_client.get("/api/v1/batches")
    assert batches.status_code == 200
    assert batches.json()["batches"][0]["batch_id"] == "BATCH-N-20261014"
    assert sum(row["record_count"] for row in batches.json()["batches"][0]["control_totals"]) == 100

    sample_payments = api_client.get("/api/v1/batches/BATCH-N-20261014/payments?limit=1")
    assert sample_payments.status_code == 200
    assert len(sample_payments.json()["payments"]) == 1

    payment_id = "PAY-N-0001"
    invalid_transition = api_client.post(
        f"/api/v1/payments/{payment_id}/transitions",
        json={"target_status": "SETTLED", "reason": "Skip is blocked"},
    )
    assert invalid_transition.status_code == 409

    simulation = api_client.post(
        "/api/v1/batches/BATCH-N-20261014/simulate",
        json={"failed_payment_ids": [payment_id]},
    )
    assert simulation.status_code == 200
    assert simulation.json()["settlement_count"] == 99
    assert simulation.json()["failed_count"] == 1
    controls_after_processing = api_client.get("/api/v1/batches").json()
    generated_settlement_batch = controls_after_processing["settlement_batches"][0]
    assert (
        sum(total["record_count"] for total in generated_settlement_batch["control_totals"]) == 99
    )
    assert sum(
        total["total_minor"] for total in generated_settlement_batch["control_totals"]
    ) == sum(
        total["total_minor"]
        for total in batches.json()["batches"][0]["control_totals"]
        if total["status"] == "CREATED"
    ) - int(
        next(
            row["amount_minor"]
            for row in api_client.get("/api/v1/batches/BATCH-N-20261014/payments?limit=100").json()[
                "payments"
            ]
            if row["payment_id"] == payment_id
        )
    )

    history = api_client.get(f"/api/v1/payments/{payment_id}/events")
    assert [event["event_type"] for event in history.json()["events"]] == [
        "IMPORTED",
        "VALIDATED",
        "PROCESSING",
        "FAILED",
    ]


def test_api_rejects_invalid_import_and_oversized_request(api_client) -> None:
    invalid = NORMAL_PAYMENTS.read_bytes().replace(b",1184158,", b",-1184158,", 1)
    response = api_client.post(
        "/api/v1/source-files/import/payment_instructions",
        content=invalid,
        headers={"content-type": "text/csv"},
    )
    assert response.status_code == 422
    assert response.json()["detail"]["issues"]

    oversized = api_client.post(
        "/api/v1/source-files/preview?kind=payment_instructions",
        content=b"x" * (5 * 1024 * 1024 + 1),
        headers={"content-type": "text/csv"},
    )
    assert oversized.status_code == 413


def test_reconciliation_api_persists_results_and_returns_side_by_side_records(api_client) -> None:
    for kind, path, filename in (
        ("payment_instructions", NORMAL_PAYMENTS, "payments.csv"),
        ("settlement_records", NORMAL_SETTLEMENTS, "settlements.csv"),
    ):
        imported = api_client.post(
            f"/api/v1/source-files/import/{kind}?file_name={filename}",
            content=path.read_bytes(),
            headers={"content-type": "text/csv"},
        )
        assert imported.status_code == 200
    run = api_client.post(
        "/api/v1/reconciliation/runs",
        json={
            "payment_batch_id": "BATCH-N-20261014",
            "settlement_batch_id": "SETTLE-N-20261015",
        },
    )
    assert run.status_code == 201
    body = run.json()
    assert body["result_count"] == 100
    assert body["matched_count"] == 100
    assert body["classification_counts"] == {"MATCHED_EXACT": 100}
    assert body["results"][0]["payment"]["payment_id"]
    assert body["results"][0]["settlement"]["settlement_id"]
    saved = api_client.get(f"/api/v1/reconciliation/runs/{body['run_id']}?limit=1&offset=99")
    assert saved.status_code == 200
    assert saved.json()["results"][0]["classification"] == "MATCHED_EXACT"
    assert api_client.get("/api/v1/reconciliation/runs/not-a-run").status_code == 404


def test_exception_fixture_reconciliation_surfaces_expected_classes(api_client) -> None:
    for kind, path, filename in (
        ("payment_instructions", EXCEPTION_PAYMENTS, "exception-payments.csv"),
        ("settlement_records", EXCEPTION_SETTLEMENTS, "exception-settlements.csv"),
    ):
        imported = api_client.post(
            f"/api/v1/source-files/import/{kind}?file_name={filename}",
            content=path.read_bytes(),
            headers={"content-type": "text/csv"},
        )
        assert imported.status_code == 200
    run = api_client.post(
        "/api/v1/reconciliation/runs",
        json={
            "payment_batch_id": "BATCH-E-20261015",
            "settlement_batch_id": "SETTLE-E-20261016",
        },
    )
    assert run.status_code == 201
    counts = run.json()["classification_counts"]
    assert counts == {
        "AMOUNT_MISMATCH": 1,
        "DUPLICATE_CANDIDATE": 20,
        "MATCHED_EXACT": 1218,
        "MATCHED_LATE": 1,
        "UNMATCHED_INSTRUCTION": 10,
        "UNMATCHED_SETTLEMENT": 10,
    }


def test_case_workflow_records_complete_immutable_actions(api_client) -> None:
    for kind, path, filename in (
        ("payment_instructions", EXCEPTION_PAYMENTS, "exception-payments.csv"),
        ("settlement_records", EXCEPTION_SETTLEMENTS, "exception-settlements.csv"),
    ):
        assert (
            api_client.post(
                f"/api/v1/source-files/import/{kind}?file_name={filename}",
                content=path.read_bytes(),
                headers={"content-type": "text/csv"},
            ).status_code
            == 200
        )
    run = api_client.post(
        "/api/v1/reconciliation/runs",
        json={
            "payment_batch_id": "BATCH-E-20261015",
            "settlement_batch_id": "SETTLE-E-20261016",
        },
    ).json()
    exception = next(row for row in run["results"] if row["classification"] == "AMOUNT_MISMATCH")
    created = api_client.post(
        "/api/v1/cases", json={"result_id": exception["result_id"], "actor": "analyst.one"}
    )
    assert created.status_code == 201
    case_id = created.json()["case_id"]
    assert [item["activity_type"] for item in created.json()["activities"]] == ["CREATED"]
    assert (
        api_client.post("/api/v1/cases", json={"result_id": exception["result_id"]}).status_code
        == 409
    )

    assert (
        api_client.post(
            f"/api/v1/cases/{case_id}/assignment",
            json={"assigned_to": "analyst.two", "actor": "team.lead"},
        ).json()["assigned_to"]
        == "analyst.two"
    )
    assert (
        api_client.post(
            f"/api/v1/cases/{case_id}/notes",
            json={"note": "Settlement file is missing the expected payment reference."},
        ).status_code
        == 200
    )
    assert (
        api_client.post(
            f"/api/v1/cases/{case_id}/transitions", json={"target_status": "IN_REVIEW"}
        ).json()["status"]
        == "IN_REVIEW"
    )
    assert (
        api_client.post(
            f"/api/v1/cases/{case_id}/transitions", json={"target_status": "ESCALATED"}
        ).status_code
        == 409
    )
    assert (
        api_client.post(
            f"/api/v1/cases/{case_id}/transitions",
            json={"target_status": "ESCALATED", "reason": "Needs settlement partner review."},
        ).json()["status"]
        == "ESCALATED"
    )
    assert (
        api_client.post(
            f"/api/v1/cases/{case_id}/transitions", json={"target_status": "IN_REVIEW"}
        ).json()["status"]
        == "IN_REVIEW"
    )
    assert (
        api_client.post(
            f"/api/v1/cases/{case_id}/transitions",
            json={"target_status": "RESOLVED", "reason": "Operations confirmed the variance."},
        ).json()["status"]
        == "RESOLVED"
    )
    assert (
        api_client.post(
            f"/api/v1/cases/{case_id}/notes", json={"note": "Resolved cases cannot be edited."}
        ).status_code
        == 409
    )
    assert (
        api_client.post(
            f"/api/v1/cases/{case_id}/transitions", json={"target_status": "OPEN"}
        ).status_code
        == 409
    )
    reopened = api_client.post(
        f"/api/v1/cases/{case_id}/transitions",
        json={"target_status": "OPEN", "reason": "New synthetic source file arrived."},
    )
    assert reopened.status_code == 200
    assert reopened.json()["resolved_at"] is None
    activities = reopened.json()["activities"]
    assert [item["activity_type"] for item in activities] == [
        "CREATED",
        "ASSIGNED",
        "NOTE_ADDED",
        "STATUS_CHANGED",
        "ESCALATED",
        "STATUS_CHANGED",
        "RESOLVED",
        "REOPENED",
    ]
    assert all(item["actor"] and item["correlation_id"] for item in activities)
    assert activities[2]["reason"].startswith("Settlement file")
    assert activities[-1]["reason"] == "New synthetic source file arrived."

    queue = api_client.get("/api/v1/cases?status=OPEN&assigned_to=analyst.two")
    assert queue.status_code == 200
    assert len(queue.json()["cases"]) == 1
    assert queue.json()["cases"][0]["case_id"] == case_id
    assert api_client.get(f"/api/v1/cases/{case_id}").json()["activities"] == activities


def test_cases_reject_matched_results_and_filter_by_exception_class(api_client) -> None:
    for kind, path, filename in (
        ("payment_instructions", NORMAL_PAYMENTS, "normal-payments.csv"),
        ("settlement_records", NORMAL_SETTLEMENTS, "normal-settlements.csv"),
    ):
        assert (
            api_client.post(
                f"/api/v1/source-files/import/{kind}?file_name={filename}",
                content=path.read_bytes(),
                headers={"content-type": "text/csv"},
            ).status_code
            == 200
        )
    run = api_client.post(
        "/api/v1/reconciliation/runs",
        json={
            "payment_batch_id": "BATCH-N-20261014",
            "settlement_batch_id": "SETTLE-N-20261015",
        },
    ).json()
    assert (
        api_client.post(
            "/api/v1/cases", json={"result_id": run["results"][0]["result_id"]}
        ).status_code
        == 409
    )
    assert api_client.get("/api/v1/cases?classification=AMOUNT_MISMATCH").json()["cases"] == []
