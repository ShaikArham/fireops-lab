from datetime import date
from pathlib import Path

import pytest

from app.services.reconciliation import reconcile, stable_hash
from app.synthetic.generate_reconciliation_preview import build_preview


def payment(**overrides: object) -> dict[str, object]:
    return {
        "payment_id": "PAY-1",
        "client_reference": "REF-1",
        "amount_minor": 1000,
        "currency": "EUR",
        "direction": "OUTBOUND",
        "expected_settlement_date": date(2026, 10, 15),
        **overrides,
    }


def settlement(**overrides: object) -> dict[str, object]:
    return {
        "settlement_id": "SET-1",
        "payment_reference": "REF-1",
        "amount_minor": 1000,
        "currency": "EUR",
        "direction": "OUTBOUND",
        "settlement_date": date(2026, 10, 15),
        **overrides,
    }


def test_exact_reference_amount_currency_and_direction_are_required() -> None:
    result = reconcile([payment()], [settlement()])
    assert [(row.classification, row.match_method) for row in result] == [
        ("MATCHED_EXACT", "EXACT_REFERENCE")
    ]
    assert reconcile([payment()], [settlement(amount_minor=900)])[0].difference_minor == -100
    currency = reconcile([payment()], [settlement(currency="USD")])
    assert [row.classification for row in currency] == [
        "UNMATCHED_INSTRUCTION",
        "UNMATCHED_SETTLEMENT",
    ]
    direction = reconcile([payment()], [settlement(direction="INBOUND")])
    assert [row.explanation_code for row in direction] == [
        "DIRECTION_MISMATCH",
        "NO_UNIQUE_PAYMENT_MATCH",
    ]


def test_late_date_window_duplicates_and_ambiguous_candidates_are_not_forced() -> None:
    late = reconcile([payment()], [settlement(settlement_date=date(2026, 10, 17))])
    assert late[0].classification == "MATCHED_LATE"
    outside = reconcile([payment()], [settlement(settlement_date=date(2026, 10, 20))])
    assert {row.classification for row in outside} == {
        "UNMATCHED_INSTRUCTION",
        "UNMATCHED_SETTLEMENT",
    }
    duplicate = reconcile([payment(), payment(payment_id="PAY-2")], [settlement()])
    assert sum(row.classification == "DUPLICATE_CANDIDATE" for row in duplicate) == 2
    assert sum(row.classification == "UNMATCHED_SETTLEMENT" for row in duplicate) == 1
    ambiguous = reconcile([payment()], [settlement(), settlement(settlement_id="SET-2")])
    assert sum(row.classification == "AMBIGUOUS_MATCH" for row in ambiguous) == 1
    assert sum(row.classification == "UNMATCHED_SETTLEMENT" for row in ambiguous) == 2


def test_run_is_deterministic_and_enforces_one_to_one() -> None:
    payments = [payment(), payment(payment_id="PAY-2", client_reference="REF-2")]
    settlements = [settlement(), settlement(settlement_id="SET-2", payment_reference="REF-2")]
    first = reconcile(payments, settlements)
    second = reconcile(list(reversed(payments)), list(reversed(settlements)))
    assert first == second
    assert len({row.payment_id for row in first if row.payment_id}) == len(payments)
    assert len({row.settlement_id for row in first if row.settlement_id}) == len(settlements)
    assert stable_hash(payments, ("payment_id", "client_reference")) == stable_hash(
        list(reversed(payments)), ("payment_id", "client_reference")
    )
    with pytest.raises(ValueError, match="between 0 and 30"):
        reconcile(payments, settlements, 31)


def test_controlled_fallback_requires_a_mutual_unique_candidate() -> None:
    payment_row = payment()
    settlement_row = settlement(payment_reference="ALTERNATE-REF")
    result = reconcile([payment_row], [settlement_row])
    assert len(result) == 1
    assert result[0].classification == "MATCHED_EXACT"
    assert result[0].match_method == "REFERENCE_AMOUNT_DATE_WINDOW"
    assert result[0].explanation_code == "UNIQUE_AMOUNT_DATE_FALLBACK"

    competing = settlement(settlement_id="SET-2", payment_reference="OTHER-REF")
    ambiguous = reconcile([payment_row], [settlement_row, competing])
    assert {row.classification for row in ambiguous} == {
        "UNMATCHED_INSTRUCTION",
        "UNMATCHED_SETTLEMENT",
    }


def test_static_preview_is_generated_by_the_same_reconciliation_engine(tmp_path: Path) -> None:
    project = Path(__file__).resolve().parents[2]
    fixture = project / "data" / "synthetic" / "exception_day"
    output = tmp_path / "preview.json"
    preview = build_preview(
        fixture / "payment_instructions.csv",
        fixture / "settlement_records.csv",
        output,
    )
    assert preview["result_count"] == 1260
    assert preview["classification_counts"]["MATCHED_EXACT"] == 1218
    assert any(
        row["explanation_code"] == "UNIQUE_AMOUNT_DATE_FALLBACK" for row in preview["samples"]
    )
    first_output = output.read_bytes()
    build_preview(
        fixture / "payment_instructions.csv",
        fixture / "settlement_records.csv",
        output,
    )
    assert output.read_bytes() == first_output
