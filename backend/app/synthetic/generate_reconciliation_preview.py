"""Build the small read-only GitHub Pages preview from the real synthetic fixture."""

from __future__ import annotations

import csv
import json
from collections import Counter
from datetime import date
from pathlib import Path

from app.services.reconciliation import RULES_VERSION, public_rows, reconcile


def build_preview(
    payments_path: Path, settlements_path: Path, output_path: Path
) -> dict[str, object]:
    with payments_path.open(encoding="utf-8", newline="") as stream:
        payments = list(csv.DictReader(stream))
    with settlements_path.open(encoding="utf-8", newline="") as stream:
        settlements = list(csv.DictReader(stream))
    for row in payments:
        row["amount_minor"] = int(row["amount_minor"])
        row["expected_settlement_date"] = date.fromisoformat(row["expected_settlement_date"])
    for row in settlements:
        row["amount_minor"] = int(row["amount_minor"])
        row["settlement_date"] = date.fromisoformat(row["settlement_date"])
    result = public_rows(reconcile(payments, settlements))
    counts = Counter(row["classification"] for row in result)
    payment_map = {row["payment_id"]: row for row in payments}
    settlement_map = {row["settlement_id"]: row for row in settlements}
    wanted = [
        "AMOUNT_MISMATCH",
        "MATCHED_LATE",
        "UNMATCHED_INSTRUCTION",
        "DUPLICATE_CANDIDATE",
        "MATCHED_EXACT",
    ]
    samples = []
    for classification in wanted:
        found = next((row for row in result if row["classification"] == classification), None)
        if found:
            samples.append(
                {
                    **found,
                    "payment": payment_map.get(found["payment_id"]),
                    "settlement": settlement_map.get(found["settlement_id"]),
                }
            )
    payload = {
        "title": "Exception day · 15 Oct 2026",
        "rules_version": RULES_VERSION,
        "synthetic_only": True,
        "payment_instruction_count": len(payments),
        "settlement_record_count": len(settlements),
        "result_count": len(result),
        "classification_counts": dict(sorted(counts.items())),
        "samples": samples,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, indent=2, sort_keys=True, default=str) + "\n", encoding="utf-8"
    )
    return payload


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    data = root / "data/synthetic/exception_day"
    build_preview(
        data / "payment_instructions.csv",
        data / "settlement_records.csv",
        root / "frontend/src/app/phase4-preview.json",
    )


if __name__ == "__main__":
    main()
