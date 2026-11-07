"""Persist reconciliation runs and one-to-one results.

Revision ID: 0003_reconciliation
Revises: 0002_payment_events
Create Date: 2026-11-08
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0003_reconciliation"
down_revision: str | None = "0002_payment_events"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "reconciliation_runs",
        sa.Column("run_id", sa.String(36), primary_key=True),
        sa.Column("payment_batch_id", sa.String(64), nullable=False),
        sa.Column("settlement_batch_id", sa.String(64), nullable=True),
        sa.Column("rules_version", sa.String(32), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("input_hashes", sa.JSON(), nullable=False),
        sa.Column("classification_counts", sa.JSON(), nullable=False),
        sa.Column("amount_mismatch_totals_minor", sa.JSON(), nullable=False),
        sa.Column("matched_count", sa.Integer(), nullable=False),
        sa.Column("unmatched_count", sa.Integer(), nullable=False),
        sa.Column("exception_count", sa.Integer(), nullable=False),
        sa.Column("result_count", sa.Integer(), nullable=False),
        sa.CheckConstraint("matched_count >= 0", name="ck_reconciliation_runs_matched_nonnegative"),
        sa.CheckConstraint(
            "unmatched_count >= 0", name="ck_reconciliation_runs_unmatched_nonnegative"
        ),
        sa.CheckConstraint(
            "exception_count >= 0", name="ck_reconciliation_runs_exception_nonnegative"
        ),
        sa.CheckConstraint("result_count >= 0", name="ck_reconciliation_runs_result_nonnegative"),
        sa.CheckConstraint("status = 'COMPLETED'", name="ck_reconciliation_runs_status"),
        sa.CheckConstraint("finished_at >= started_at", name="ck_reconciliation_runs_time_order"),
    )
    op.create_index(
        "ix_reconciliation_runs_payment_batch", "reconciliation_runs", ["payment_batch_id"]
    )
    op.create_table(
        "reconciliation_results",
        sa.Column("result_id", sa.String(36), primary_key=True),
        sa.Column(
            "run_id",
            sa.String(36),
            sa.ForeignKey("reconciliation_runs.run_id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "payment_id",
            sa.String(64),
            sa.ForeignKey("payment_instructions.payment_id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column(
            "settlement_id",
            sa.String(64),
            sa.ForeignKey("settlement_records.settlement_id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column("classification", sa.String(32), nullable=False),
        sa.Column("difference_minor", sa.BigInteger(), nullable=True),
        sa.Column("explanation_code", sa.String(64), nullable=False),
        sa.Column("match_method", sa.String(32), nullable=False),
        sa.CheckConstraint(
            "classification IN ('MATCHED_EXACT', 'MATCHED_LATE', "
            "'UNMATCHED_INSTRUCTION', 'UNMATCHED_SETTLEMENT', "
            "'AMOUNT_MISMATCH', 'DUPLICATE_CANDIDATE', 'AMBIGUOUS_MATCH')",
            name="ck_reconciliation_results_classification",
        ),
        sa.CheckConstraint(
            "match_method IN ('EXACT_REFERENCE', 'REFERENCE_AMOUNT_DATE_WINDOW', 'NONE')",
            name="ck_reconciliation_results_match_method",
        ),
        sa.CheckConstraint(
            "payment_id IS NOT NULL OR settlement_id IS NOT NULL",
            name="ck_reconciliation_results_has_source_record",
        ),
        sa.UniqueConstraint("run_id", "payment_id", name="uq_reconciliation_results_run_payment"),
        sa.UniqueConstraint(
            "run_id", "settlement_id", name="uq_reconciliation_results_run_settlement"
        ),
    )
    op.create_index(
        "ix_reconciliation_results_run_classification",
        "reconciliation_results",
        ["run_id", "classification"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_reconciliation_results_run_classification", table_name="reconciliation_results"
    )
    op.drop_table("reconciliation_results")
    op.drop_index("ix_reconciliation_runs_payment_batch", table_name="reconciliation_runs")
    op.drop_table("reconciliation_runs")
