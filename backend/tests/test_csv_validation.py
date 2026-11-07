import csv
import io

import pytest

from app.schemas.records import PaymentInstructionRow, SettlementRecordRow
from app.services.csv_validation import MAX_DATA_ROWS, MAX_FILE_BYTES, validate_csv
from app.synthetic.generate import PAYMENT_HEADERS, SETTLEMENT_HEADERS


def payment_row(**overrides: str) -> dict[str, str]:
    row = {
        "payment_id": "PAY-T-0001",
        "client_reference": "Référence-一",
        "created_at": "2026-10-14T08:00:00Z",
        "instructed_at": "2026-10-14T08:01:00Z",
        "amount_minor": "1250",
        "currency": "EUR",
        "direction": "OUTBOUND",
        "payer_account_token": "SYN-PAYER-0001",
        "payee_account_token": "SYN-PAYEE-0001",
        "scheme": "SEPA_CREDIT",
        "expected_settlement_date": "2026-10-15",
        "status": "CREATED",
        "batch_id": "BATCH-T-20261014",
        "idempotency_key": "IDEMP-T-0001",
    }
    row.update(overrides)
    return row


def settlement_row(**overrides: str) -> dict[str, str]:
    row = {
        "settlement_id": "SET-T-0001",
        "scheme_reference": "SCHEME-T-0001",
        "payment_reference": "Référence-一",
        "settlement_date": "2026-10-15",
        "amount_minor": "1250",
        "currency": "EUR",
        "direction": "OUTBOUND",
        "settlement_batch_id": "SETTLE-T-20261015",
    }
    row.update(overrides)
    return row


def csv_bytes(headers: tuple[str, ...], *rows: dict[str, str]) -> bytes:
    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=headers, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue().encode("utf-8")


def test_valid_instruction_and_settlement_rows_parse_with_unicode_and_minor_units() -> None:
    payment = validate_csv(csv_bytes(PAYMENT_HEADERS, payment_row()), "payment_instructions")
    settlement = validate_csv(csv_bytes(SETTLEMENT_HEADERS, settlement_row()), "settlement_records")

    assert payment.is_valid
    assert len(payment.records) == 1
    assert isinstance(payment.records[0], PaymentInstructionRow)
    assert payment.records[0].amount_minor == 1250
    assert payment.records[0].client_reference == "Référence-一"
    assert payment.records[0].created_at.tzinfo is not None
    assert settlement.is_valid
    assert isinstance(settlement.records[0], SettlementRecordRow)


@pytest.mark.parametrize(
    ("changes", "expected_code"),
    [
        ({"amount_minor": "-1"}, "unsafe_cell"),
        ({"amount_minor": "1.25"}, "invalid_value"),
        ({"amount_minor": "0"}, "invalid_value"),
        ({"amount_minor": "9223372036854775808"}, "invalid_value"),
        ({"currency": "CAD"}, "invalid_value"),
        ({"payer_account_token": "GB00FAKE00000000000000"}, "invalid_value"),
        ({"created_at": "2026-10-14T08:00:00"}, "invalid_value"),
        ({"instructed_at": "2026-10-14T07:59:00Z"}, "invalid_value"),
        ({"client_reference": '  =WEBSERVICE("bad")'}, "unsafe_cell"),
    ],
)
def test_unsafe_or_invalid_payment_values_reject_the_whole_file(
    changes: dict[str, str], expected_code: str
) -> None:
    result = validate_csv(
        csv_bytes(PAYMENT_HEADERS, payment_row(), payment_row(payment_id="PAY-T-0002", **changes)),
        "payment_instructions",
    )

    assert not result.is_valid
    assert result.records == ()
    assert any(issue.code == expected_code and issue.row_number == 3 for issue in result.issues)


def test_duplicate_primary_and_idempotency_identifiers_are_rejected() -> None:
    repeated_payment = payment_row(payment_id="PAY-T-0001", idempotency_key="IDEMP-T-0002")
    repeated_key = payment_row(payment_id="PAY-T-0002", idempotency_key="IDEMP-T-0001")
    result = validate_csv(
        csv_bytes(PAYMENT_HEADERS, payment_row(), repeated_payment, repeated_key),
        "payment_instructions",
    )

    assert {issue.field for issue in result.issues} == {"payment_id", "idempotency_key"}
    assert all(issue.code == "duplicate_identifier" for issue in result.issues)
    assert result.records == ()


def test_duplicate_settlement_ids_are_rejected() -> None:
    duplicate = settlement_row(settlement_id="SET-T-0001", scheme_reference="SCHEME-T-0002")
    result = validate_csv(
        csv_bytes(SETTLEMENT_HEADERS, settlement_row(), duplicate), "settlement_records"
    )
    assert result.issues[0].code == "duplicate_identifier"
    assert result.issues[0].field == "settlement_id"


@pytest.mark.parametrize(
    ("content", "expected_code"),
    [
        (b"", "empty_file"),
        (b"\xff\xfe", "invalid_encoding"),
        (b"one,two\n1,2\n", "invalid_header"),
        (b"payment_id,payment_id\n1,2\n", "duplicate_header"),
        (b'settlement_id,"broken\n', "malformed_csv"),
    ],
)
def test_file_level_validation_failures(content: bytes, expected_code: str) -> None:
    result = validate_csv(content, "settlement_records")
    assert not result.is_valid
    assert result.issues[0].code == expected_code
    assert result.records == ()


def test_header_only_file_is_rejected_as_empty_dataset() -> None:
    result = validate_csv(csv_bytes(PAYMENT_HEADERS), "payment_instructions")
    assert result.issues[0].code == "empty_dataset"


def test_wrong_row_width_is_reported_with_source_row_number() -> None:
    content = (",".join(PAYMENT_HEADERS) + "\nshort,row\n").encode()
    result = validate_csv(content, "payment_instructions")
    assert result.issues[0].code == "column_count"
    assert result.issues[0].row_number == 2


def test_issue_reporting_is_bounded_but_row_limit_is_still_checked() -> None:
    invalid_rows = [
        payment_row(
            payment_id=f"PAY-BAD-{index:04d}",
            client_reference=f"REF-BAD-{index:04d}",
            idempotency_key=f"IDEMP-BAD-{index:04d}",
            amount_minor="0",
        )
        for index in range(1, 151)
    ]
    result = validate_csv(csv_bytes(PAYMENT_HEADERS, *invalid_rows), "payment_instructions")
    assert len(result.issues) == 100
    assert result.issues_truncated
    assert result.data_row_count == 150
    assert result.records == ()


def test_file_size_and_row_count_limits_are_enforced() -> None:
    oversized = validate_csv(b"x" * (MAX_FILE_BYTES + 1), "settlement_records")
    assert oversized.issues[0].code == "file_too_large"

    rows = [
        payment_row(
            payment_id=f"PAY-T-{index:05d}",
            client_reference=f"REF-T-{index:05d}",
            idempotency_key=f"IDEMP-T-{index:05d}",
        )
        for index in range(1, MAX_DATA_ROWS + 2)
    ]
    too_many_rows = csv_bytes(PAYMENT_HEADERS, *rows)
    result = validate_csv(too_many_rows, "payment_instructions")
    assert result.issues[0].code == "too_many_rows"
    assert result.records == ()


def test_checksum_is_sha256_of_original_bytes() -> None:
    content = csv_bytes(SETTLEMENT_HEADERS, settlement_row())
    result = validate_csv(content, "settlement_records")
    import hashlib

    assert result.checksum_sha256 == hashlib.sha256(content).hexdigest()
