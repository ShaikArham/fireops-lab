"""Create source-file, payment-instruction, and settlement tables.

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-07
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "source_files",
        sa.Column("source_file_id", sa.String(length=36), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("row_count", sa.Integer(), nullable=False),
        sa.Column("validation_status", sa.String(length=16), nullable=False),
        sa.Column("source_type", sa.String(length=24), nullable=False),
        sa.CheckConstraint("length(checksum_sha256) = 64", name="ck_source_files_checksum_length"),
        sa.CheckConstraint("row_count >= 0", name="ck_source_files_row_count_nonnegative"),
        sa.CheckConstraint(
            "source_type IN ('PAYMENT_INSTRUCTION', 'SETTLEMENT')",
            name="ck_source_files_source_type",
        ),
        sa.CheckConstraint(
            "validation_status IN ('PENDING', 'VALID', 'INVALID')",
            name="ck_source_files_validation_status",
        ),
        sa.PrimaryKeyConstraint("source_file_id"),
        sa.UniqueConstraint("checksum_sha256", "source_type", name="uq_source_files_checksum_type"),
    )
    op.create_index("ix_source_files_checksum_sha256", "source_files", ["checksum_sha256"])

    op.create_table(
        "payment_instructions",
        sa.Column("payment_id", sa.String(length=64), nullable=False),
        sa.Column("client_reference", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("instructed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("amount_minor", sa.BigInteger(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("direction", sa.String(length=8), nullable=False),
        sa.Column("payer_account_token", sa.String(length=64), nullable=False),
        sa.Column("payee_account_token", sa.String(length=64), nullable=False),
        sa.Column("scheme", sa.String(length=32), nullable=False),
        sa.Column("expected_settlement_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("batch_id", sa.String(length=64), nullable=False),
        sa.Column("idempotency_key", sa.String(length=128), nullable=False),
        sa.Column("source_file_id", sa.String(length=36), nullable=False),
        sa.CheckConstraint("amount_minor > 0", name="ck_payment_instructions_amount_positive"),
        sa.CheckConstraint(
            "currency IN ('EUR', 'GBP', 'USD')", name="ck_payment_instructions_currency"
        ),
        sa.CheckConstraint(
            "direction IN ('INBOUND', 'OUTBOUND')", name="ck_payment_instructions_direction"
        ),
        sa.CheckConstraint(
            "status IN ('CREATED', 'VALIDATED', 'PROCESSING', 'SETTLED', 'FAILED')",
            name="ck_payment_instructions_status",
        ),
        sa.CheckConstraint(
            "instructed_at >= created_at", name="ck_payment_instructions_time_order"
        ),
        sa.CheckConstraint(
            "payer_account_token LIKE 'SYN-%'", name="ck_payment_instructions_payer_synthetic"
        ),
        sa.CheckConstraint(
            "payee_account_token LIKE 'SYN-%'", name="ck_payment_instructions_payee_synthetic"
        ),
        sa.ForeignKeyConstraint(
            ["source_file_id"], ["source_files.source_file_id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("payment_id"),
        sa.UniqueConstraint("idempotency_key", name="uq_payment_instructions_idempotency_key"),
    )
    op.create_index(
        "ix_payment_instructions_client_reference", "payment_instructions", ["client_reference"]
    )
    op.create_index(
        "ix_payment_instructions_instructed_at", "payment_instructions", ["instructed_at"]
    )

    op.create_table(
        "settlement_records",
        sa.Column("settlement_id", sa.String(length=64), nullable=False),
        sa.Column("scheme_reference", sa.String(length=128), nullable=False),
        sa.Column("payment_reference", sa.String(length=128), nullable=False),
        sa.Column("settlement_date", sa.Date(), nullable=False),
        sa.Column("amount_minor", sa.BigInteger(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("direction", sa.String(length=8), nullable=False),
        sa.Column("settlement_batch_id", sa.String(length=64), nullable=False),
        sa.Column("source_file_id", sa.String(length=36), nullable=False),
        sa.CheckConstraint("amount_minor > 0", name="ck_settlement_records_amount_positive"),
        sa.CheckConstraint(
            "currency IN ('EUR', 'GBP', 'USD')", name="ck_settlement_records_currency"
        ),
        sa.CheckConstraint(
            "direction IN ('INBOUND', 'OUTBOUND')", name="ck_settlement_records_direction"
        ),
        sa.ForeignKeyConstraint(
            ["source_file_id"], ["source_files.source_file_id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("settlement_id"),
    )
    op.create_index(
        "ix_settlement_records_payment_reference", "settlement_records", ["payment_reference"]
    )
    op.create_index(
        "ix_settlement_records_settlement_date", "settlement_records", ["settlement_date"]
    )


def downgrade() -> None:
    op.drop_index("ix_settlement_records_settlement_date", table_name="settlement_records")
    op.drop_index("ix_settlement_records_payment_reference", table_name="settlement_records")
    op.drop_table("settlement_records")
    op.drop_index("ix_payment_instructions_instructed_at", table_name="payment_instructions")
    op.drop_index("ix_payment_instructions_client_reference", table_name="payment_instructions")
    op.drop_table("payment_instructions")
    op.drop_index("ix_source_files_checksum_sha256", table_name="source_files")
    op.drop_table("source_files")
