from datetime import UTC, datetime, timedelta

from app.services.monitoring_rules import RULE_CATALOG, evaluate_monitoring


def payment(
    payment_id: str = "PAY-1",
    *,
    reference: str = "REF-1",
    payer: str = "SYN-PAYER-1",
    amount: int = 500_000,
    at: datetime | None = None,
) -> dict[str, object]:
    return {
        "payment_id": payment_id,
        "client_reference": reference,
        "payer_account_token": payer,
        "amount_minor": amount,
        "currency": "EUR",
        "instructed_at": at or datetime(2026, 11, 7, 8, tzinfo=UTC),
    }


def alert_ids(alerts) -> set[str]:  # noqa: ANN001
    return {alert.rule_id for alert in alerts}


def test_rule_catalog_has_four_explainable_rules_and_false_positive_examples() -> None:
    assert len(RULE_CATALOG) == 4
    assert all(
        rule["threshold"] and rule["purpose"] and rule["false_positive_example"]
        for rule in RULE_CATALOG
    )


def test_high_value_threshold_is_inclusive_and_evidence_is_integer_minor_units() -> None:
    below = evaluate_monitoring([payment(amount=1_899_999)], [])
    at_limit = evaluate_monitoring([payment(amount=1_900_000)], [])
    assert "HIGH_VALUE_PAYMENT" not in alert_ids(below)
    high_value = next(alert for alert in at_limit if alert.rule_id == "HIGH_VALUE_PAYMENT")
    assert high_value.evidence["amount_minor"] == 1_900_000
    assert high_value.evidence["currency"] == "EUR"
    assert "review" in high_value.explanation.lower()


def test_velocity_threshold_uses_a_ten_minute_sliding_window() -> None:
    start = datetime(2026, 11, 7, 8, tzinfo=UTC)
    five = [payment(f"PAY-{index}", at=start + timedelta(minutes=3 * index)) for index in range(5)]
    five_inside_window = [
        payment(f"PAY-{index}", at=start + timedelta(minutes=2 * index + (2 if index == 4 else 0)))
        for index in range(5)
    ]
    alerts = evaluate_monitoring(five_inside_window, [])
    velocity = next(alert for alert in alerts if alert.rule_id == "PAYER_VELOCITY")
    assert velocity.evidence["instruction_count"] == 5
    assert "PAYER_VELOCITY" not in alert_ids(evaluate_monitoring(five[:4], []))
    assert "PAYER_VELOCITY" not in alert_ids(evaluate_monitoring(five, []))


def test_failed_events_only_alert_when_same_synthetic_payer_repeats() -> None:
    start = datetime(2026, 11, 7, 8, tzinfo=UTC)
    rows = [payment("PAY-1", payer="SYN-PAYER-A"), payment("PAY-2", payer="SYN-PAYER-A")]
    events = [
        {
            "event_type": "FAILED",
            "payment_id": row["payment_id"],
            "occurred_at": start + timedelta(hours=i),
        }
        for i, row in enumerate(rows)
    ]
    assert "REPEATED_FAILURES" in alert_ids(evaluate_monitoring(rows, events))
    outside_window = [
        dict(event, occurred_at=start + timedelta(hours=25 * i)) for i, event in enumerate(events)
    ]
    assert "REPEATED_FAILURES" not in alert_ids(evaluate_monitoring(rows, outside_window))
    unrelated = [dict(events[0], payment_id="PAY-UNKNOWN"), events[1]]
    assert "REPEATED_FAILURES" not in alert_ids(evaluate_monitoring(rows, unrelated))


def test_duplicate_reference_requires_distinct_instructions() -> None:
    duplicate = [payment("PAY-1"), payment("PAY-2")]
    alerts = evaluate_monitoring(duplicate, [])
    repeated = next(alert for alert in alerts if alert.rule_id == "DUPLICATE_REFERENCE")
    assert repeated.evidence["payment_ids"] == ["PAY-1", "PAY-2"]
    assert "DUPLICATE_REFERENCE" not in alert_ids(evaluate_monitoring([duplicate[0]], []))
