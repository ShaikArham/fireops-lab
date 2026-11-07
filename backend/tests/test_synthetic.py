import csv
import hashlib
import json
from pathlib import Path

from app.services.csv_validation import validate_csv
from app.synthetic.generate import generate_datasets


def test_generated_datasets_have_repeatable_bytes_counts_and_checksums(tmp_path: Path) -> None:
    first_dir = tmp_path / "first"
    second_dir = tmp_path / "second"
    first_manifest = generate_datasets(first_dir)
    second_manifest = generate_datasets(second_dir)
    committed_dir = Path(__file__).resolve().parents[2] / "data" / "synthetic"

    assert first_manifest == second_manifest
    assert (first_dir / "manifest.json").read_bytes() == (second_dir / "manifest.json").read_bytes()
    assert (first_dir / "manifest.json").read_bytes() == (
        committed_dir / "manifest.json"
    ).read_bytes()
    for relative_path in (
        "normal_day/payment_instructions.csv",
        "normal_day/settlement_records.csv",
        "exception_day/payment_instructions.csv",
        "exception_day/settlement_records.csv",
    ):
        first_bytes = (first_dir / relative_path).read_bytes()
        second_bytes = (second_dir / relative_path).read_bytes()
        committed_bytes = (committed_dir / relative_path).read_bytes()
        assert first_bytes == second_bytes
        assert first_bytes == committed_bytes
        assert hashlib.sha256(first_bytes).hexdigest()

    assert first_manifest["datasets"]["normal_day"]["counts"] == {
        "payment_instructions": 100,
        "settlement_records": 100,
    }
    assert first_manifest["datasets"]["exception_day"]["counts"] == {
        "payment_instructions": 1250,
        "settlement_records": 1230,
    }
    assert first_manifest["datasets"]["exception_day"]["intentional_exceptions"] == {
        "missing_settlement": 10,
        "duplicate_instruction": 10,
    }


def test_committed_fixture_manifest_checksums_and_rows_are_valid() -> None:
    fixture_root = Path(__file__).resolve().parents[2] / "data" / "synthetic"
    manifest = json.loads((fixture_root / "manifest.json").read_text(encoding="utf-8"))

    for dataset_name, dataset in manifest["datasets"].items():
        for filename, record_kind, count_name in (
            ("payment_instructions.csv", "payment_instructions", "payment_instructions"),
            ("settlement_records.csv", "settlement_records", "settlement_records"),
        ):
            path = fixture_root / dataset_name / filename
            content = path.read_bytes()
            assert hashlib.sha256(content).hexdigest() == dataset["sha256"][filename]
            result = validate_csv(content, record_kind)
            assert result.is_valid, result.issues[:3]
            assert len(result.records) == dataset["counts"][count_name]


def test_exception_fixture_contains_only_expected_duplicate_references_and_synthetic_tokens() -> (
    None
):
    fixture_root = Path(__file__).resolve().parents[2] / "data" / "synthetic" / "exception_day"
    with (fixture_root / "payment_instructions.csv").open(encoding="utf-8", newline="") as handle:
        payments = list(csv.DictReader(handle))

    references = [row["client_reference"] for row in payments]
    duplicate_references = {
        reference for reference in references if references.count(reference) > 1
    }
    assert len(duplicate_references) == 10
    with (fixture_root / "settlement_records.csv").open(encoding="utf-8", newline="") as handle:
        settlement_references = {row["payment_reference"] for row in csv.DictReader(handle)}
    assert len(set(references) - settlement_references) == 10
    assert all(row["payer_account_token"].startswith("SYN-") for row in payments)
    assert all(row["payee_account_token"].startswith("SYN-") for row in payments)
