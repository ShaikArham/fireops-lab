from datetime import UTC, date, datetime
from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy import create_engine, event, inspect
from sqlalchemy.exc import IntegrityError

from alembic import command
from app.db.base import Base
from app.models import PaymentInstruction, SourceFile  # noqa: F401


def test_alembic_upgrade_creates_phase_two_schema(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    database_path = tmp_path / "phase_two.db"
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", f"sqlite:///{database_path}")

    command.upgrade(config, "head")
    command.check(config)

    engine = create_engine(f"sqlite:///{database_path}")
    table_names = set(inspect(engine).get_table_names())
    assert {
        "source_files",
        "payment_instructions",
        "settlement_records",
        "alembic_version",
    } <= table_names
    engine.dispose()


@pytest.mark.parametrize(
    ("field", "invalid_value"),
    [
        ("amount_minor", 0),
        ("currency", "CAD"),
        ("direction", "SIDEWAYS"),
        ("status", "UNKNOWN"),
        ("payer_account_token", "IE00NOTSYNTHETIC000000"),
        ("instructed_at", datetime(2026, 11, 6, tzinfo=UTC)),
    ],
)
def test_database_checks_reject_invalid_payment_values(
    tmp_path: Path, field: str, invalid_value: object
) -> None:
    database_path = tmp_path / "constraints.db"
    engine = create_engine(f"sqlite:///{database_path}")

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, connection_record) -> None:  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(
            SourceFile.__table__.insert().values(
                source_file_id="00000000-0000-0000-0000-000000000001",
                file_name="synthetic.csv",
                checksum_sha256="a" * 64,
                uploaded_at=datetime(2026, 11, 7, tzinfo=UTC),
                row_count=1,
                validation_status="VALID",
                source_type="PAYMENT_INSTRUCTION",
            )
        )
    values: dict[str, object] = {
        "payment_id": "PAY-T-1",
        "client_reference": "REF-T-1",
        "created_at": datetime(2026, 11, 7, tzinfo=UTC),
        "instructed_at": datetime(2026, 11, 7, 0, 1, tzinfo=UTC),
        "amount_minor": 100,
        "currency": "EUR",
        "direction": "OUTBOUND",
        "payer_account_token": "SYN-PAYER-1",
        "payee_account_token": "SYN-PAYEE-1",
        "scheme": "SEPA_CREDIT",
        "expected_settlement_date": date(2026, 11, 8),
        "status": "CREATED",
        "batch_id": "BATCH-T-1",
        "idempotency_key": "IDEMP-T-1",
        "source_file_id": "00000000-0000-0000-0000-000000000001",
    }
    values[field] = invalid_value
    with pytest.raises(IntegrityError):
        with engine.begin() as connection:
            connection.execute(PaymentInstruction.__table__.insert().values(**values))
    engine.dispose()


def test_database_requires_a_source_file_foreign_key(tmp_path: Path) -> None:
    database_path = tmp_path / "foreign_key.db"
    engine = create_engine(f"sqlite:///{database_path}")

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, connection_record) -> None:  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    values = {
        "payment_id": "PAY-T-1",
        "client_reference": "REF-T-1",
        "created_at": datetime(2026, 11, 7, tzinfo=UTC),
        "instructed_at": datetime(2026, 11, 7, 0, 1, tzinfo=UTC),
        "amount_minor": 100,
        "currency": "EUR",
        "direction": "OUTBOUND",
        "payer_account_token": "SYN-PAYER-1",
        "payee_account_token": "SYN-PAYEE-1",
        "scheme": "SEPA_CREDIT",
        "expected_settlement_date": date(2026, 11, 8),
        "status": "CREATED",
        "batch_id": "BATCH-T-1",
        "idempotency_key": "IDEMP-T-1",
        "source_file_id": "missing-source-file",
    }
    with pytest.raises(IntegrityError):
        with engine.begin() as connection:
            connection.execute(PaymentInstruction.__table__.insert().values(**values))
    engine.dispose()
