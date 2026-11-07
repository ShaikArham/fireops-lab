from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
NORMAL_PAYMENTS = PROJECT_ROOT / "data/synthetic/normal_day/payment_instructions.csv"


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
    assert sum(
        row["record_count"] for row in batches.json()["batches"][0]["control_totals"]
    ) == 100

    sample_payments = api_client.get(
        "/api/v1/batches/BATCH-N-20261014/payments?limit=1"
    )
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
    assert sum(
        total["record_count"] for total in generated_settlement_batch["control_totals"]
    ) == 99
    assert sum(
        total["total_minor"] for total in generated_settlement_batch["control_totals"]
    ) == sum(
        total["total_minor"]
        for total in batches.json()["batches"][0]["control_totals"]
        if total["status"] == "CREATED"
    ) - int(
        next(
            row["amount_minor"]
            for row in api_client.get(
                "/api/v1/batches/BATCH-N-20261014/payments?limit=100"
            ).json()["payments"]
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

