from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.services.csv_validation import DatasetKind

PaymentStatus = Literal["CREATED", "VALIDATED", "PROCESSING", "SETTLED", "FAILED"]
Actor = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=128)]
Reason = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class ValidationIssueResponse(BaseModel):
    row_number: int | None
    field: str | None
    code: str
    message: str


class SourcePreviewResponse(BaseModel):
    kind: DatasetKind
    checksum_sha256: str
    data_row_count: int
    is_valid: bool
    issues_truncated: bool
    issues: list[ValidationIssueResponse]
    preview: list[dict[str, object]]
    preview_limit: int = 25


class ImportResponse(BaseModel):
    source_file_id: str
    source_type: str
    checksum_sha256: str
    row_count: int
    imported_count: int
    idempotent: bool


class PaymentTransitionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target_status: PaymentStatus
    actor: Actor = "demo-analyst"
    reason: Reason


class PaymentTransitionResponse(BaseModel):
    payment_id: str
    status: PaymentStatus
    batch_id: str


class SimulateBatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    failed_payment_ids: list[str] = Field(default_factory=list, max_length=10_000)
    actor: Actor = "system:simulation"


class SimulateBatchResponse(BaseModel):
    batch_id: str
    processed_count: int
    settled_count: int
    failed_count: int
    settlement_count: int
    settlement_totals_minor: dict[str, int]
    idempotent: bool
