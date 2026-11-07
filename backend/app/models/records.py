from datetime import date, datetime

from sqlalchemy import (
    JSON,
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SourceFile(Base):
    __tablename__ = "source_files"
    __table_args__ = (
        CheckConstraint("length(checksum_sha256) = 64", name="ck_source_files_checksum_length"),
        CheckConstraint("row_count >= 0", name="ck_source_files_row_count_nonnegative"),
        CheckConstraint(
            "validation_status IN ('PENDING', 'VALID', 'INVALID')",
            name="ck_source_files_validation_status",
        ),
        CheckConstraint(
            "source_type IN ('PAYMENT_INSTRUCTION', 'SETTLEMENT')",
            name="ck_source_files_source_type",
        ),
        UniqueConstraint("checksum_sha256", "source_type", name="uq_source_files_checksum_type"),
    )

    source_file_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    checksum_sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    row_count: Mapped[int] = mapped_column(nullable=False)
    validation_status: Mapped[str] = mapped_column(String(16), nullable=False)
    source_type: Mapped[str] = mapped_column(String(24), nullable=False)


class PaymentEvent(Base):
    __tablename__ = "payment_events"
    __table_args__ = (
        CheckConstraint(
            "event_type IN ('IMPORTED', 'VALIDATED', 'PROCESSING', 'SETTLED', 'FAILED')",
            name="ck_payment_events_event_type",
        ),
        Index("ix_payment_events_payment_occurred", "payment_id", "occurred_at"),
    )

    event_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    payment_id: Mapped[str] = mapped_column(
        ForeignKey("payment_instructions.payment_id", ondelete="RESTRICT"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(16), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    metadata_json: Mapped[dict[str, object]] = mapped_column(JSON, nullable=False, default=dict)
    actor: Mapped[str] = mapped_column(String(128), nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(64), nullable=False)


class PaymentInstruction(Base):
    __tablename__ = "payment_instructions"
    __table_args__ = (
        CheckConstraint("amount_minor > 0", name="ck_payment_instructions_amount_positive"),
        CheckConstraint(
            "currency IN ('EUR', 'GBP', 'USD')", name="ck_payment_instructions_currency"
        ),
        CheckConstraint(
            "direction IN ('INBOUND', 'OUTBOUND')", name="ck_payment_instructions_direction"
        ),
        CheckConstraint(
            "status IN ('CREATED', 'VALIDATED', 'PROCESSING', 'SETTLED', 'FAILED')",
            name="ck_payment_instructions_status",
        ),
        CheckConstraint("instructed_at >= created_at", name="ck_payment_instructions_time_order"),
        CheckConstraint(
            "payer_account_token LIKE 'SYN-%'", name="ck_payment_instructions_payer_synthetic"
        ),
        CheckConstraint(
            "payee_account_token LIKE 'SYN-%'", name="ck_payment_instructions_payee_synthetic"
        ),
        UniqueConstraint("idempotency_key", name="uq_payment_instructions_idempotency_key"),
        Index("ix_payment_instructions_client_reference", "client_reference"),
        Index("ix_payment_instructions_instructed_at", "instructed_at"),
    )

    payment_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    client_reference: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    instructed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    amount_minor: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    direction: Mapped[str] = mapped_column(String(8), nullable=False)
    payer_account_token: Mapped[str] = mapped_column(String(64), nullable=False)
    payee_account_token: Mapped[str] = mapped_column(String(64), nullable=False)
    scheme: Mapped[str] = mapped_column(String(32), nullable=False)
    expected_settlement_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    batch_id: Mapped[str] = mapped_column(String(64), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)
    source_file_id: Mapped[str] = mapped_column(
        ForeignKey("source_files.source_file_id", ondelete="RESTRICT"), nullable=False
    )


class SettlementRecord(Base):
    __tablename__ = "settlement_records"
    __table_args__ = (
        CheckConstraint("amount_minor > 0", name="ck_settlement_records_amount_positive"),
        CheckConstraint("currency IN ('EUR', 'GBP', 'USD')", name="ck_settlement_records_currency"),
        CheckConstraint(
            "direction IN ('INBOUND', 'OUTBOUND')", name="ck_settlement_records_direction"
        ),
        Index("ix_settlement_records_payment_reference", "payment_reference"),
        Index("ix_settlement_records_settlement_date", "settlement_date"),
    )

    settlement_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    scheme_reference: Mapped[str] = mapped_column(String(128), nullable=False)
    payment_reference: Mapped[str] = mapped_column(String(128), nullable=False)
    settlement_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount_minor: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    direction: Mapped[str] = mapped_column(String(8), nullable=False)
    settlement_batch_id: Mapped[str] = mapped_column(String(64), nullable=False)
    source_file_id: Mapped[str] = mapped_column(
        ForeignKey("source_files.source_file_id", ondelete="RESTRICT"), nullable=False
    )


class ReconciliationRun(Base):
    __tablename__ = "reconciliation_runs"
    __table_args__ = (
        CheckConstraint("matched_count >= 0", name="ck_reconciliation_runs_matched_nonnegative"),
        CheckConstraint(
            "unmatched_count >= 0", name="ck_reconciliation_runs_unmatched_nonnegative"
        ),
        CheckConstraint(
            "exception_count >= 0", name="ck_reconciliation_runs_exception_nonnegative"
        ),
        CheckConstraint("result_count >= 0", name="ck_reconciliation_runs_result_nonnegative"),
        CheckConstraint("status = 'COMPLETED'", name="ck_reconciliation_runs_status"),
        CheckConstraint("finished_at >= started_at", name="ck_reconciliation_runs_time_order"),
        Index("ix_reconciliation_runs_payment_batch", "payment_batch_id"),
    )

    run_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    payment_batch_id: Mapped[str] = mapped_column(String(64), nullable=False)
    settlement_batch_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    rules_version: Mapped[str] = mapped_column(String(32), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    input_hashes: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False)
    classification_counts: Mapped[dict[str, int]] = mapped_column(JSON, nullable=False)
    amount_mismatch_totals_minor: Mapped[dict[str, int]] = mapped_column(JSON, nullable=False)
    matched_count: Mapped[int] = mapped_column(nullable=False)
    unmatched_count: Mapped[int] = mapped_column(nullable=False)
    exception_count: Mapped[int] = mapped_column(nullable=False)
    result_count: Mapped[int] = mapped_column(nullable=False)


class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"
    __table_args__ = (
        CheckConstraint(
            "classification IN ('MATCHED_EXACT', 'MATCHED_LATE', 'UNMATCHED_INSTRUCTION', "
            "'UNMATCHED_SETTLEMENT', 'AMOUNT_MISMATCH', 'DUPLICATE_CANDIDATE', 'AMBIGUOUS_MATCH')",
            name="ck_reconciliation_results_classification",
        ),
        CheckConstraint(
            "match_method IN ('EXACT_REFERENCE', 'REFERENCE_AMOUNT_DATE_WINDOW', 'NONE')",
            name="ck_reconciliation_results_match_method",
        ),
        CheckConstraint(
            "payment_id IS NOT NULL OR settlement_id IS NOT NULL",
            name="ck_reconciliation_results_has_source_record",
        ),
        UniqueConstraint("run_id", "payment_id", name="uq_reconciliation_results_run_payment"),
        UniqueConstraint(
            "run_id", "settlement_id", name="uq_reconciliation_results_run_settlement"
        ),
        Index("ix_reconciliation_results_run_classification", "run_id", "classification"),
    )

    result_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    run_id: Mapped[str] = mapped_column(
        ForeignKey("reconciliation_runs.run_id", ondelete="RESTRICT"), nullable=False
    )
    payment_id: Mapped[str | None] = mapped_column(
        ForeignKey("payment_instructions.payment_id", ondelete="RESTRICT"), nullable=True
    )
    settlement_id: Mapped[str | None] = mapped_column(
        ForeignKey("settlement_records.settlement_id", ondelete="RESTRICT"), nullable=True
    )
    classification: Mapped[str] = mapped_column(String(32), nullable=False)
    difference_minor: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    explanation_code: Mapped[str] = mapped_column(String(64), nullable=False)
    match_method: Mapped[str] = mapped_column(String(32), nullable=False)


class ExceptionCase(Base):
    __tablename__ = "exception_cases"
    __table_args__ = (
        CheckConstraint(
            "status IN ('OPEN', 'IN_REVIEW', 'ESCALATED', 'RESOLVED')",
            name="ck_exception_cases_status",
        ),
        CheckConstraint(
            "priority IN ('LOW', 'NORMAL', 'HIGH')", name="ck_exception_cases_priority"
        ),
        UniqueConstraint("result_id", name="uq_exception_cases_result"),
        Index("ix_exception_cases_status_updated", "status", "updated_at"),
        Index("ix_exception_cases_assignee_status", "assigned_to", "status"),
    )

    case_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    result_id: Mapped[str] = mapped_column(
        ForeignKey("reconciliation_results.result_id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    priority: Mapped[str] = mapped_column(String(16), nullable=False, default="NORMAL")
    assigned_to: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    version: Mapped[int] = mapped_column(nullable=False, default=1)


class CaseActivity(Base):
    __tablename__ = "case_activities"
    __table_args__ = (
        CheckConstraint(
            "activity_type IN ('CREATED', 'ASSIGNED', 'NOTE_ADDED', 'STATUS_CHANGED', "
            "'ESCALATED', 'RESOLVED', 'REOPENED')",
            name="ck_case_activities_type",
        ),
        Index("ix_case_activities_case_occurred", "case_id", "occurred_at", "activity_id"),
    )

    activity_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(
        ForeignKey("exception_cases.case_id", ondelete="RESTRICT"), nullable=False
    )
    activity_type: Mapped[str] = mapped_column(String(16), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    actor: Mapped[str] = mapped_column(String(128), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    from_value: Mapped[str | None] = mapped_column(String(128), nullable=True)
    to_value: Mapped[str | None] = mapped_column(String(128), nullable=True)
    correlation_id: Mapped[str] = mapped_column(String(64), nullable=False)


class MonitoringRun(Base):
    __tablename__ = "monitoring_runs"
    __table_args__ = (
        CheckConstraint("alert_count >= 0", name="ck_monitoring_runs_alert_count_nonnegative"),
        UniqueConstraint(
            "batch_id", "rules_version", "source_hash", name="uq_monitoring_runs_inputs"
        ),
        Index("ix_monitoring_runs_batch_created", "batch_id", "created_at"),
    )

    run_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    batch_id: Mapped[str] = mapped_column(String(64), nullable=False)
    rules_version: Mapped[str] = mapped_column(String(32), nullable=False)
    source_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    alert_count: Mapped[int] = mapped_column(nullable=False)
    alert_counts: Mapped[dict[str, int]] = mapped_column(JSON, nullable=False)


class MonitoringAlert(Base):
    __tablename__ = "monitoring_alerts"
    __table_args__ = (
        CheckConstraint(
            "status IN ('OPEN', 'IN_REVIEW', 'DISMISSED', 'ESCALATED')",
            name="ck_monitoring_alerts_status",
        ),
        CheckConstraint(
            "severity IN ('INFO', 'REVIEW', 'PRIORITY')", name="ck_monitoring_alerts_severity"
        ),
        UniqueConstraint("run_id", "rule_id", "group_key", name="uq_monitoring_alerts_rule_group"),
        Index("ix_monitoring_alerts_status_severity", "status", "severity"),
    )

    alert_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    run_id: Mapped[str] = mapped_column(
        ForeignKey("monitoring_runs.run_id", ondelete="RESTRICT"), nullable=False
    )
    rule_id: Mapped[str] = mapped_column(String(48), nullable=False)
    group_key: Mapped[str] = mapped_column(String(128), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    explanation: Mapped[str] = mapped_column(String(500), nullable=False)
    threshold: Mapped[str] = mapped_column(String(160), nullable=False)
    false_positive_example: Mapped[str] = mapped_column(String(300), nullable=False)
    evidence: Mapped[dict[str, object]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    disposition_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    version: Mapped[int] = mapped_column(nullable=False, default=1)


class MonitoringActivity(Base):
    __tablename__ = "monitoring_activities"
    __table_args__ = (
        CheckConstraint(
            "activity_type IN ('DETECTED', 'REVIEW_STARTED', 'NOTE_ADDED', "
            "'DISMISSED', 'ESCALATED')",
            name="ck_monitoring_activities_type",
        ),
        Index("ix_monitoring_activities_alert_occurred", "alert_id", "occurred_at", "activity_id"),
    )

    activity_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    alert_id: Mapped[str] = mapped_column(
        ForeignKey("monitoring_alerts.alert_id", ondelete="RESTRICT"), nullable=False
    )
    activity_type: Mapped[str] = mapped_column(String(24), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    actor: Mapped[str] = mapped_column(String(128), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    from_status: Mapped[str | None] = mapped_column(String(16), nullable=True)
    to_status: Mapped[str | None] = mapped_column(String(16), nullable=True)
    correlation_id: Mapped[str] = mapped_column(String(64), nullable=False)
