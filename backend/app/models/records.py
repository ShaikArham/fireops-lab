from datetime import date, datetime

from sqlalchemy import (
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
