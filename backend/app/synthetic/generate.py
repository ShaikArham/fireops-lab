import argparse
import csv
import hashlib
import json
import random
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

PAYMENT_HEADERS = (
    "payment_id",
    "client_reference",
    "created_at",
    "instructed_at",
    "amount_minor",
    "currency",
    "direction",
    "payer_account_token",
    "payee_account_token",
    "scheme",
    "expected_settlement_date",
    "status",
    "batch_id",
    "idempotency_key",
)
SETTLEMENT_HEADERS = (
    "settlement_id",
    "scheme_reference",
    "payment_reference",
    "settlement_date",
    "amount_minor",
    "currency",
    "direction",
    "settlement_batch_id",
)
GENERATOR_VERSION = "1.1.0"
DEFAULT_SEED = 20261107
SUPPORTED_CURRENCIES = ("EUR", "GBP", "USD")


def _timestamp(day: date, minute_offset: int) -> str:
    value = datetime(day.year, day.month, day.day, 8, tzinfo=UTC) + timedelta(minutes=minute_offset)
    return value.isoformat().replace("+00:00", "Z")


def _payment(index: int, day: date, batch_code: str, rng: random.Random) -> dict[str, str]:
    return {
        "payment_id": f"PAY-{batch_code}-{index:04d}",
        "client_reference": f"REF-{batch_code}-{index:04d}",
        "created_at": _timestamp(day, index % 60),
        "instructed_at": _timestamp(day, index % 60 + 1),
        "amount_minor": str(rng.randint(100, 2_000_000)),
        "currency": rng.choice(SUPPORTED_CURRENCIES),
        "direction": "INBOUND" if index % 2 == 0 else "OUTBOUND",
        "payer_account_token": f"SYN-PAYER-{index:04d}",
        "payee_account_token": f"SYN-PAYEE-{index:04d}",
        "scheme": "SEPA_CREDIT" if index % 5 else "SEPA_INSTANT",
        "expected_settlement_date": (day + timedelta(days=1)).isoformat(),
        "status": "CREATED",
        "batch_id": f"BATCH-{batch_code}-{day:%Y%m%d}",
        "idempotency_key": f"IDEMP-{batch_code}-{index:04d}",
    }


def _settlement(payment: dict[str, str], index: int, batch_code: str, day: date) -> dict[str, str]:
    return {
        "settlement_id": f"SET-{batch_code}-{index:04d}",
        "scheme_reference": f"SCHEME-{batch_code}-{index:04d}",
        "payment_reference": payment["client_reference"],
        "settlement_date": (day + timedelta(days=1)).isoformat(),
        "amount_minor": payment["amount_minor"],
        "currency": payment["currency"],
        "direction": payment["direction"],
        "settlement_batch_id": f"SETTLE-{batch_code}-{day + timedelta(days=1):%Y%m%d}",
    }


def _write_csv(path: Path, headers: tuple[str, ...], rows: list[dict[str, str]]) -> bytes:
    path.parent.mkdir(parents=True, exist_ok=True)
    import io

    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=headers, extrasaction="raise", lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    content = buffer.getvalue().encode("utf-8")
    path.write_bytes(content)
    return content


def generate_datasets(output_dir: Path, seed: int = DEFAULT_SEED) -> dict[str, object]:
    rng = random.Random(seed)
    datasets: dict[str, dict[str, object]] = {}

    normal_day = date(2026, 10, 14)
    normal_payments = [_payment(i, normal_day, "N", rng) for i in range(1, 101)]
    normal_settlements = [
        _settlement(payment, index, "N", normal_day)
        for index, payment in enumerate(normal_payments, start=1)
    ]
    datasets["normal_day"] = {
        "day": normal_day.isoformat(),
        "payment_instructions": normal_payments,
        "settlement_records": normal_settlements,
        "intentional_exceptions": {
            "missing_settlement": 0,
            "duplicate_instruction": 0,
            "amount_mismatch": 0,
            "late_settlement": 0,
            "reference_fallback": 0,
        },
    }

    exception_day = date(2026, 10, 15)
    unique_payments = [_payment(i, exception_day, "E", rng) for i in range(1, 1241)]
    duplicate_payments: list[dict[str, str]] = []
    for duplicate_number, original in enumerate(unique_payments[:10], start=1):
        duplicate = original.copy()
        duplicate["payment_id"] = f"PAY-E-DUP-{duplicate_number:04d}"
        duplicate["idempotency_key"] = f"IDEMP-E-DUP-{duplicate_number:04d}"
        duplicate_payments.append(duplicate)
    exception_payments = unique_payments + duplicate_payments
    missing_payment_ids = {payment["payment_id"] for payment in unique_payments[-10:]}
    exception_settlements = [
        _settlement(payment, index, "E", exception_day)
        for index, payment in enumerate(unique_payments, start=1)
        if payment["payment_id"] not in missing_payment_ids
    ]
    # Keep the first two generated settlement exceptions stable and easy to investigate.
    exception_settlements[10]["amount_minor"] = str(
        int(exception_settlements[10]["amount_minor"]) + 125
    )
    exception_settlements[11]["settlement_date"] = (
        date.fromisoformat(exception_settlements[11]["settlement_date"]) + timedelta(days=2)
    ).isoformat()
    exception_settlements[12]["payment_reference"] = "ALT-REF-E-0013"
    datasets["exception_day"] = {
        "day": exception_day.isoformat(),
        "payment_instructions": exception_payments,
        "settlement_records": exception_settlements,
        "intentional_exceptions": {
            "missing_settlement": 10,
            "duplicate_instruction": 10,
            "amount_mismatch": 1,
            "late_settlement": 1,
            "reference_fallback": 1,
        },
    }

    manifest_datasets: dict[str, object] = {}
    for name, dataset in datasets.items():
        directory = output_dir / name
        payment_bytes = _write_csv(
            directory / "payment_instructions.csv", PAYMENT_HEADERS, dataset["payment_instructions"]
        )
        settlement_bytes = _write_csv(
            directory / "settlement_records.csv", SETTLEMENT_HEADERS, dataset["settlement_records"]
        )
        manifest_datasets[name] = {
            "business_date": dataset["day"],
            "counts": {
                "payment_instructions": len(dataset["payment_instructions"]),
                "settlement_records": len(dataset["settlement_records"]),
            },
            "intentional_exceptions": dataset["intentional_exceptions"],
            "sha256": {
                "payment_instructions.csv": hashlib.sha256(payment_bytes).hexdigest(),
                "settlement_records.csv": hashlib.sha256(settlement_bytes).hexdigest(),
            },
        }

    manifest: dict[str, object] = {
        "generator_version": GENERATOR_VERSION,
        "seed": seed,
        "currency_policy": "Amounts use integer minor units. Currency is explicit per row.",
        "data_policy": "Entirely synthetic. Account values use SYN-prefixed tokens.",
        "datasets": manifest_datasets,
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest_bytes = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode("utf-8")
    (output_dir / "manifest.json").write_bytes(manifest_bytes)
    return manifest


def main() -> None:
    project_root = Path(__file__).resolve().parents[3]
    parser = argparse.ArgumentParser(
        description="Generate reproducible fictional FireOps CSV data."
    )
    parser.add_argument("--output-dir", type=Path, default=project_root / "data" / "synthetic")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    args = parser.parse_args()
    manifest = generate_datasets(args.output_dir, args.seed)
    print(json.dumps(manifest["datasets"], indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
