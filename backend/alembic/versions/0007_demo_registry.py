"""Add bounded demo session registry (workspace records live in isolated schemas)."""

from alembic import op
from app.demo import registry

revision = "0007_demo_registry"
down_revision = "0006_case_root_cause"
branch_labels = None
depends_on = None


def upgrade() -> None:
    registry.create_all(
        op.get_bind().execution_options(schema_translate_map={"public": None})
        if op.get_bind().dialect.name == "sqlite"
        else op.get_bind()
    )


def downgrade() -> None:
    registry.drop_all(
        op.get_bind().execution_options(schema_translate_map={"public": None})
        if op.get_bind().dialect.name == "sqlite"
        else op.get_bind()
    )
