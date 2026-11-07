"""Persist explainable rule alerts and human review activity.

Revision ID: 0005_monitoring
Revises: 0004_exception_cases
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005_monitoring"
down_revision: str | None = "0004_exception_cases"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "monitoring_runs",
        sa.Column("run_id", sa.String(36), primary_key=True),
        sa.Column("batch_id", sa.String(64), nullable=False),
        sa.Column("rules_version", sa.String(32), nullable=False),
        sa.Column("source_hash", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("alert_count", sa.Integer(), nullable=False),
        sa.Column("alert_counts", sa.JSON(), nullable=False),
        sa.CheckConstraint("alert_count >= 0", name="ck_monitoring_runs_alert_count_nonnegative"),
        sa.UniqueConstraint(
            "batch_id", "rules_version", "source_hash", name="uq_monitoring_runs_inputs"
        ),
    )
    op.create_index(
        "ix_monitoring_runs_batch_created", "monitoring_runs", ["batch_id", "created_at"]
    )
    op.create_table(
        "monitoring_alerts",
        sa.Column("alert_id", sa.String(36), primary_key=True),
        sa.Column(
            "run_id",
            sa.String(36),
            sa.ForeignKey("monitoring_runs.run_id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("rule_id", sa.String(48), nullable=False),
        sa.Column("group_key", sa.String(128), nullable=False),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("severity", sa.String(16), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("explanation", sa.String(500), nullable=False),
        sa.Column("threshold", sa.String(160), nullable=False),
        sa.Column("false_positive_example", sa.String(300), nullable=False),
        sa.Column("evidence", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("disposition_reason", sa.String(500), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.CheckConstraint(
            "status IN ('OPEN', 'IN_REVIEW', 'DISMISSED', 'ESCALATED')",
            name="ck_monitoring_alerts_status",
        ),
        sa.CheckConstraint(
            "severity IN ('INFO', 'REVIEW', 'PRIORITY')", name="ck_monitoring_alerts_severity"
        ),
        sa.UniqueConstraint(
            "run_id", "rule_id", "group_key", name="uq_monitoring_alerts_rule_group"
        ),
    )
    op.create_index(
        "ix_monitoring_alerts_status_severity", "monitoring_alerts", ["status", "severity"]
    )
    op.create_table(
        "monitoring_activities",
        sa.Column("activity_id", sa.String(36), primary_key=True),
        sa.Column(
            "alert_id",
            sa.String(36),
            sa.ForeignKey("monitoring_alerts.alert_id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("activity_type", sa.String(24), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actor", sa.String(128), nullable=False),
        sa.Column("reason", sa.String(500), nullable=True),
        sa.Column("from_status", sa.String(16), nullable=True),
        sa.Column("to_status", sa.String(16), nullable=True),
        sa.Column("correlation_id", sa.String(64), nullable=False),
        sa.CheckConstraint(
            "activity_type IN ('DETECTED', 'REVIEW_STARTED', 'NOTE_ADDED', "
            "'DISMISSED', 'ESCALATED')",
            name="ck_monitoring_activities_type",
        ),
    )
    op.create_index(
        "ix_monitoring_activities_alert_occurred",
        "monitoring_activities",
        ["alert_id", "occurred_at", "activity_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_monitoring_activities_alert_occurred", table_name="monitoring_activities")
    op.drop_table("monitoring_activities")
    op.drop_index("ix_monitoring_alerts_status_severity", table_name="monitoring_alerts")
    op.drop_table("monitoring_alerts")
    op.drop_index("ix_monitoring_runs_batch_created", table_name="monitoring_runs")
    op.drop_table("monitoring_runs")
