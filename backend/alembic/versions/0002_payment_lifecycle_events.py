"""Add immutable payment lifecycle events.

Revision ID: 0002_payment_events
Revises: 0001_initial
Create Date: 2026-11-08
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0002_payment_events"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "payment_events",
        sa.Column("event_id", sa.String(length=36), nullable=False),
        sa.Column("payment_id", sa.String(length=64), nullable=False),
        sa.Column("event_type", sa.String(length=16), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("actor", sa.String(length=128), nullable=False),
        sa.Column("correlation_id", sa.String(length=64), nullable=False),
        sa.CheckConstraint(
            "event_type IN ('IMPORTED', 'VALIDATED', 'PROCESSING', 'SETTLED', 'FAILED')",
            name="ck_payment_events_event_type",
        ),
        sa.ForeignKeyConstraint(
            ["payment_id"], ["payment_instructions.payment_id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("event_id"),
    )
    op.create_index(
        "ix_payment_events_payment_occurred",
        "payment_events",
        ["payment_id", "occurred_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_payment_events_payment_occurred", table_name="payment_events")
    op.drop_table("payment_events")
