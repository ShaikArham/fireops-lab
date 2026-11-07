"""Explainable, deterministic, one-to-one reconciliation rules."""

from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from dataclasses import asdict, dataclass
from typing import Any

RULES_VERSION = "reconciliation-v1"


@dataclass(frozen=True)
class ReconciliationRow:
    payment_id: str | None
    settlement_id: str | None
    classification: str
    difference_minor: int | None
    explanation_code: str
    match_method: str


def stable_hash(rows: list[dict[str, Any]], keys: tuple[str, ...]) -> str:
    canonical = [
        {key: row[key] for key in keys}
        for row in sorted(rows, key=lambda r: tuple(str(r[k]) for k in keys))
    ]
    encoded = json.dumps(canonical, sort_keys=True, separators=(",", ":"), default=str).encode()
    return hashlib.sha256(encoded).hexdigest()


def reconcile(
    payments: list[dict[str, Any]], settlements: list[dict[str, Any]], late_window_days: int = 3
) -> list[ReconciliationRow]:
    """Match exact references without forcing ambiguous or invalid pairs."""
    if not 0 <= late_window_days <= 30:
        raise ValueError("late_window_days must be between 0 and 30")
    payment_refs: dict[str, list[dict[str, Any]]] = defaultdict(list)
    settlement_refs: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for payment in payments:
        payment_refs[payment["client_reference"]].append(payment)
    for settlement in settlements:
        settlement_refs[settlement["payment_reference"]].append(settlement)

    rows: list[ReconciliationRow] = []
    consumed: set[str] = set()
    missing_reference_payments: list[dict[str, Any]] = []
    for payment in sorted(payments, key=lambda item: item["payment_id"]):
        reference = payment["client_reference"]
        candidates = settlement_refs.get(reference, [])
        same_payments = payment_refs[reference]
        if len(same_payments) > 1:
            rows.append(
                ReconciliationRow(
                    payment["payment_id"],
                    None,
                    "DUPLICATE_CANDIDATE",
                    None,
                    "DUPLICATE_PAYMENT_REFERENCE",
                    "NONE",
                )
            )
            continue
        if not candidates:
            missing_reference_payments.append(payment)
            continue
        if len(candidates) > 1:
            rows.append(
                ReconciliationRow(
                    payment["payment_id"],
                    None,
                    "AMBIGUOUS_MATCH",
                    None,
                    "MULTIPLE_SETTLEMENT_CANDIDATES",
                    "NONE",
                )
            )
            continue
        settlement = candidates[0]
        if payment["currency"] != settlement["currency"]:
            rows.append(
                ReconciliationRow(
                    payment["payment_id"],
                    None,
                    "UNMATCHED_INSTRUCTION",
                    None,
                    "CURRENCY_MISMATCH",
                    "NONE",
                )
            )
            continue
        if payment["direction"] != settlement["direction"]:
            rows.append(
                ReconciliationRow(
                    payment["payment_id"],
                    None,
                    "UNMATCHED_INSTRUCTION",
                    None,
                    "DIRECTION_MISMATCH",
                    "NONE",
                )
            )
            continue
        days = (settlement["settlement_date"] - payment["expected_settlement_date"]).days
        if days < 0 or days > late_window_days:
            rows.append(
                ReconciliationRow(
                    payment["payment_id"],
                    None,
                    "UNMATCHED_INSTRUCTION",
                    None,
                    "SETTLEMENT_OUTSIDE_DATE_WINDOW",
                    "NONE",
                )
            )
            continue
        consumed.add(settlement["settlement_id"])
        difference = settlement["amount_minor"] - payment["amount_minor"]
        if difference:
            rows.append(
                ReconciliationRow(
                    payment["payment_id"],
                    settlement["settlement_id"],
                    "AMOUNT_MISMATCH",
                    difference,
                    "AMOUNT_DIFFERS",
                    "EXACT_REFERENCE",
                )
            )
        elif days:
            rows.append(
                ReconciliationRow(
                    payment["payment_id"],
                    settlement["settlement_id"],
                    "MATCHED_LATE",
                    0,
                    "REFERENCE_AMOUNT_DATE_WINDOW",
                    "REFERENCE_AMOUNT_DATE_WINDOW",
                )
            )
        else:
            rows.append(
                ReconciliationRow(
                    payment["payment_id"],
                    settlement["settlement_id"],
                    "MATCHED_EXACT",
                    0,
                    "REFERENCE_AMOUNT_DATE_WINDOW",
                    "EXACT_REFERENCE",
                )
            )

    # Controlled fallback: accept only a mutual single candidate with exact amount,
    # currency and direction, a settlement date on/after expected, and no exact ref.
    fallback_settlements = [
        settlement
        for settlement in settlements
        if settlement["settlement_id"] not in consumed
        and settlement["payment_reference"] not in payment_refs
    ]
    payment_candidates: dict[str, list[dict[str, Any]]] = defaultdict(list)
    settlement_candidates: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for payment in missing_reference_payments:
        for settlement in fallback_settlements:
            days = (settlement["settlement_date"] - payment["expected_settlement_date"]).days
            if (
                payment["amount_minor"] == settlement["amount_minor"]
                and payment["currency"] == settlement["currency"]
                and payment["direction"] == settlement["direction"]
                and 0 <= days <= late_window_days
            ):
                payment_candidates[payment["payment_id"]].append(settlement)
                settlement_candidates[settlement["settlement_id"]].append(payment)
    fallback_matched: set[str] = set()
    payments_by_id = {payment["payment_id"]: payment for payment in missing_reference_payments}
    for payment_id, candidates in payment_candidates.items():
        if len(candidates) != 1:
            continue
        settlement = candidates[0]
        if len(settlement_candidates[settlement["settlement_id"]]) != 1:
            continue
        payment = payments_by_id[payment_id]
        days = (settlement["settlement_date"] - payment["expected_settlement_date"]).days
        fallback_matched.add(payment_id)
        consumed.add(settlement["settlement_id"])
        rows.append(
            ReconciliationRow(
                payment_id,
                settlement["settlement_id"],
                "MATCHED_LATE" if days else "MATCHED_EXACT",
                0,
                "UNIQUE_AMOUNT_DATE_FALLBACK",
                "REFERENCE_AMOUNT_DATE_WINDOW",
            )
        )
    for payment in missing_reference_payments:
        if payment["payment_id"] not in fallback_matched:
            rows.append(
                ReconciliationRow(
                    payment["payment_id"],
                    None,
                    "UNMATCHED_INSTRUCTION",
                    None,
                    "NO_SETTLEMENT_REFERENCE",
                    "NONE",
                )
            )

    for settlement in sorted(settlements, key=lambda item: item["settlement_id"]):
        if settlement["settlement_id"] not in consumed:
            code = (
                "DUPLICATE_PAYMENT_REFERENCE"
                if len(payment_refs.get(settlement["payment_reference"], [])) > 1
                else "NO_UNIQUE_PAYMENT_MATCH"
            )
            rows.append(
                ReconciliationRow(
                    None, settlement["settlement_id"], "UNMATCHED_SETTLEMENT", None, code, "NONE"
                )
            )
    return rows


def public_rows(rows: list[ReconciliationRow]) -> list[dict[str, Any]]:
    return [asdict(row) for row in rows]
