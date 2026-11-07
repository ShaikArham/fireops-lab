"""Record analyst-assigned case root causes for reporting.

Revision ID: 0006_case_root_cause
Revises: 0005_monitoring
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006_case_root_cause"
down_revision: str | None = "0005_monitoring"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("exception_cases") as batch_op:
        batch_op.add_column(sa.Column("root_cause", sa.String(32), nullable=True))
        batch_op.create_check_constraint(
            "ck_exception_cases_root_cause",
            "root_cause IS NULL OR root_cause IN ('SETTLEMENT_DELAY', 'SOURCE_DATA_QUALITY', "
            "'DUPLICATE_INSTRUCTION', 'PROCESSING_FAILURE', 'INCOMPLETE_BATCH', 'OTHER', "
            "'UNCONFIRMED')",
        )
    op.add_column("case_activities", sa.Column("root_cause", sa.String(32), nullable=True))


def downgrade() -> None:
    op.drop_column("case_activities", "root_cause")
    with op.batch_alter_table("exception_cases") as batch_op:
        batch_op.drop_constraint("ck_exception_cases_root_cause", type_="check")
        batch_op.drop_column("root_cause")
