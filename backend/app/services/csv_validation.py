import csv
import hashlib
import io
from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, ValidationError

from app.schemas.records import PaymentInstructionRow, SettlementRecordRow

DatasetKind = Literal["payment_instructions", "settlement_records"]
MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_DATA_ROWS = 10_000
MAX_REPORTED_ISSUES = 100

ROW_MODELS: dict[DatasetKind, type[BaseModel]] = {
    "payment_instructions": PaymentInstructionRow,
    "settlement_records": SettlementRecordRow,
}
UNIQUE_FIELDS: dict[DatasetKind, tuple[str, ...]] = {
    "payment_instructions": ("payment_id", "idempotency_key"),
    "settlement_records": ("settlement_id",),
}


@dataclass(frozen=True)
class ValidationIssue:
    row_number: int | None
    field: str | None
    code: str
    message: str


@dataclass(frozen=True)
class CSVValidationResult:
    kind: DatasetKind
    checksum_sha256: str
    data_row_count: int
    records: tuple[BaseModel, ...]
    issues: tuple[ValidationIssue, ...]
    issues_truncated: bool = False

    @property
    def is_valid(self) -> bool:
        return not self.issues


def _file_error(kind: DatasetKind, content: bytes, code: str, message: str) -> CSVValidationResult:
    return CSVValidationResult(
        kind=kind,
        checksum_sha256=hashlib.sha256(content).hexdigest(),
        data_row_count=0,
        records=(),
        issues=(ValidationIssue(None, None, code, message),),
    )


def validate_csv(content: bytes, kind: DatasetKind) -> CSVValidationResult:
    """Validate one synthetic CSV as an all-or-nothing import preview."""
    checksum = hashlib.sha256(content).hexdigest()
    if len(content) > MAX_FILE_BYTES:
        return _file_error(kind, content, "file_too_large", "File exceeds the 5 MiB limit.")
    if not content:
        return _file_error(kind, content, "empty_file", "File is empty.")
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return _file_error(kind, content, "invalid_encoding", "File must use UTF-8 encoding.")

    model = ROW_MODELS[kind]
    expected_headers = tuple(model.model_fields)
    issues: list[ValidationIssue] = []
    records: list[BaseModel] = []
    issues_truncated = False
    seen: dict[str, set[str]] = {field: set() for field in UNIQUE_FIELDS[kind]}

    def add_issue(issue: ValidationIssue) -> None:
        nonlocal issues_truncated
        if len(issues) < MAX_REPORTED_ISSUES:
            issues.append(issue)
        else:
            issues_truncated = True

    try:
        reader = csv.reader(io.StringIO(decoded, newline=""), strict=True)
        header = next(reader, None)
        if not header:
            return _file_error(kind, content, "missing_header", "CSV header row is required.")
        if len(set(header)) != len(header):
            return _file_error(
                kind, content, "duplicate_header", "CSV contains duplicate column names."
            )
        if set(header) != set(expected_headers) or len(header) != len(expected_headers):
            return _file_error(
                kind,
                content,
                "invalid_header",
                f"Columns must be exactly: {', '.join(expected_headers)}.",
            )

        data_row_count = 0
        for row_number, values in enumerate(reader, start=2):
            if not values or all(not value.strip() for value in values):
                continue
            data_row_count += 1
            if data_row_count > MAX_DATA_ROWS:
                return _file_error(
                    kind, content, "too_many_rows", "File exceeds the 10,000 data-row limit."
                )
            if len(values) != len(header):
                add_issue(
                    ValidationIssue(
                        row_number, None, "column_count", "Row has the wrong number of columns."
                    )
                )
                continue
            raw = dict(zip(header, values, strict=True))
            try:
                record = model.model_validate(raw)
            except ValidationError as error:
                for item in error.errors(include_input=False):
                    field = str(item["loc"][0]) if item["loc"] else None
                    code = "unsafe_cell" if "formula_like_cell" in item["msg"] else "invalid_value"
                    add_issue(
                        ValidationIssue(
                            row_number, field, code, item["msg"].replace("Value error, ", "")
                        )
                    )
                continue

            duplicate_fields = [
                field for field in UNIQUE_FIELDS[kind] if getattr(record, field) in seen[field]
            ]
            for field in UNIQUE_FIELDS[kind]:
                seen[field].add(getattr(record, field))
            if duplicate_fields:
                for field in duplicate_fields:
                    add_issue(
                        ValidationIssue(
                            row_number,
                            field,
                            "duplicate_identifier",
                            "Value must be unique in this file.",
                        )
                    )
                continue
            records.append(record)
    except (csv.Error, UnicodeError):
        return _file_error(
            kind, content, "malformed_csv", "CSV quoting or row structure is malformed."
        )

    if data_row_count == 0:
        return _file_error(
            kind, content, "empty_dataset", "CSV must contain at least one data row."
        )

    # Do not return partial records: one invalid row rejects the complete file preview.
    accepted_records = tuple(records) if not issues else ()
    return CSVValidationResult(
        kind=kind,
        checksum_sha256=checksum,
        data_row_count=data_row_count,
        records=accepted_records,
        issues=tuple(issues),
        issues_truncated=issues_truncated,
    )
