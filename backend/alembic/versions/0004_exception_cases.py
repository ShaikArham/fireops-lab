"""Add investigation cases and append-only case activity.

Revision ID: 0004_exception_cases
Revises: 0003_reconciliation
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0004_exception_cases"
down_revision: str | None = "0003_reconciliation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "exception_cases",
        sa.Column("case_id", sa.String(36), primary_key=True),
        sa.Column(
            "result_id",
            sa.String(36),
            sa.ForeignKey("reconciliation_results.result_id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("priority", sa.String(16), nullable=False),
        sa.Column("assigned_to", sa.String(128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "status IN ('OPEN', 'IN_REVIEW', 'ESCALATED', 'RESOLVED')",
            name="ck_exception_cases_status",
        ),
        sa.CheckConstraint(
            "priority IN ('LOW', 'NORMAL', 'HIGH')", name="ck_exception_cases_priority"
        ),
        sa.UniqueConstraint("result_id", name="uq_exception_cases_result"),
    )
    op.create_index(
        "ix_exception_cases_status_updated", "exception_cases", ["status", "updated_at"]
    )
    op.create_index(
        "ix_exception_cases_assignee_status", "exception_cases", ["assigned_to", "status"]
    )
    op.create_table(
        "case_activities",
        sa.Column("activity_id", sa.String(36), primary_key=True),
        sa.Column(
            "case_id",
            sa.String(36),
            sa.ForeignKey("exception_cases.case_id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("activity_type", sa.String(16), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actor", sa.String(128), nullable=False),
        sa.Column("reason", sa.String(500), nullable=True),
        sa.Column("from_value", sa.String(128), nullable=True),
        sa.Column("to_value", sa.String(128), nullable=True),
        sa.Column("correlation_id", sa.String(64), nullable=False),
        sa.CheckConstraint(
            "activity_type IN ('CREATED', 'ASSIGNED', 'NOTE_ADDED', 'STATUS_CHANGED', "
            "'ESCALATED', 'RESOLVED', 'REOPENED')",
            name="ck_case_activities_type",
        ),
    )
    op.create_index(
        "ix_case_activities_case_occurred",
        "case_activities",
        ["case_id", "occurred_at", "activity_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_case_activities_case_occurred", table_name="case_activities")
    op.drop_table("case_activities")
    op.drop_index("ix_exception_cases_assignee_status", table_name="exception_cases")
    op.drop_index("ix_exception_cases_status_updated", table_name="exception_cases")
    op.drop_table("exception_cases")
