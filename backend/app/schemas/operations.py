from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.services.csv_validation import DatasetKind

PaymentStatus = Literal["CREATED", "VALIDATED", "PROCESSING", "SETTLED", "FAILED"]
Actor = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=128)]
Reason = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]
OptionalActor = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=128)
]
CaseStatus = Literal["OPEN", "IN_REVIEW", "ESCALATED", "RESOLVED"]
CasePriority = Literal["LOW", "NORMAL", "HIGH"]
MonitoringStatus = Literal["IN_REVIEW", "DISMISSED", "ESCALATED"]


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


class ReconciliationRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payment_batch_id: str = Field(min_length=1, max_length=64)
    settlement_batch_id: str = Field(min_length=1, max_length=64)
    late_window_days: int = Field(default=3, ge=0, le=30)


class CaseCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    result_id: str = Field(min_length=1, max_length=36)
    actor: Actor = "demo-analyst"
    priority: CasePriority = "NORMAL"


class CaseAssignRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    assigned_to: OptionalActor | None
    actor: Actor = "demo-analyst"


class CaseNoteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    note: Reason
    actor: Actor = "demo-analyst"


class CaseTransitionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target_status: CaseStatus
    actor: Actor = "demo-analyst"
    reason: Reason | None = None


class MonitoringRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    batch_id: str = Field(min_length=1, max_length=64)
    actor: Actor = "system:monitoring"


class AlertTransitionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target_status: MonitoringStatus
    actor: Actor = "demo-analyst"
    reason: Reason | None = None


class AlertNoteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    note: Reason
    actor: Actor = "demo-analyst"
