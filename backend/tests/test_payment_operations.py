import csv
import io
from datetime import UTC, datetime
from pathlib import Path

import pytest
from sqlalchemy import create_engine, event, func, select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import PaymentEvent, PaymentInstruction, SettlementRecord, SourceFile
from app.services.payment_operations import (
    ImportConflict,
    ImportRejected,
    InvalidTransition,
    import_source_file,
    simulate_payment_batch,
    transition_payment,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
NORMAL_PAYMENTS = PROJECT_ROOT / "data/synthetic/normal_day/payment_instructions.csv"


@pytest.fixture
def session(tmp_path: Path):
    engine = create_engine(f"sqlite:///{tmp_path / 'operations.db'}")

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(dbapi_connection, connection_record) -> None:  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    with Session(engine, expire_on_commit=False) as db_session:
        yield db_session
    engine.dispose()


def _first_payment_csv() -> bytes:
    with NORMAL_PAYMENTS.open(newline="", encoding="utf-8") as source:
        reader = csv.DictReader(source)
        first = next(reader)
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=list(first), lineterminator="\n")
    writer.writeheader()
    writer.writerow(first)
    return output.getvalue().encode("utf-8")


def test_payment_import_is_atomic_and_reimport_is_idempotent(session: Session) -> None:
    content = NORMAL_PAYMENTS.read_bytes()
    first = import_source_file(
        session,
        file_name="payment_instructions.csv",
        content=content,
        kind="payment_instructions",
    )
    second = import_source_file(
        session,
        file_name="renamed_copy.csv",
        content=content,
        kind="payment_instructions",
    )

    assert first.imported_count == 100
    assert not first.idempotent
    assert second.source_file_id == first.source_file_id
    assert second.imported_count == 0
    assert second.idempotent
    assert session.scalar(select(func.count()).select_from(PaymentInstruction)) == 100
    assert session.scalar(select(func.count()).select_from(PaymentEvent)) == 100
    assert session.scalar(select(func.count()).select_from(SourceFile)) == 1


def test_invalid_row_rejects_entire_import_without_partial_records(session: Session) -> None:
    valid = _first_payment_csv().decode("utf-8")
    invalid = valid.replace(",1184158,", ",-1184158,")

    with pytest.raises(ImportRejected):
        import_source_file(
            session,
            file_name="invalid.csv",
            content=invalid.encode("utf-8"),
            kind="payment_instructions",
        )

    assert session.scalar(select(func.count()).select_from(PaymentInstruction)) == 0
    assert session.scalar(select(func.count()).select_from(SourceFile)) == 0


def test_conflicting_payment_identifier_rolls_back_all_rows(session: Session) -> None:
    import_source_file(
        session,
        file_name="first.csv",
        content=_first_payment_csv(),
        kind="payment_instructions",
    )
    with NORMAL_PAYMENTS.open(newline="", encoding="utf-8") as source:
        rows = list(csv.DictReader(source))[:2]
    rows[0]["amount_minor"] = str(int(rows[0]["amount_minor"]) + 1)
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=list(rows[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)

    with pytest.raises(ImportConflict):
        import_source_file(
            session,
            file_name="conflict.csv",
            content=output.getvalue().encode("utf-8"),
            kind="payment_instructions",
        )

    assert session.scalar(select(func.count()).select_from(PaymentInstruction)) == 1
    assert session.scalar(select(func.count()).select_from(SourceFile)) == 1


def test_payment_state_machine_records_ordered_events_and_blocks_skips(session: Session) -> None:
    imported = import_source_file(
        session,
        file_name="one.csv",
        content=_first_payment_csv(),
        kind="payment_instructions",
        now=datetime(2026, 11, 7, 9, tzinfo=UTC),
    )
    payment_id = session.scalar(select(PaymentInstruction.payment_id))
    assert payment_id is not None

    with pytest.raises(InvalidTransition):
        transition_payment(
            session,
            payment_id=payment_id,
            target_status="SETTLED",
            actor="analyst",
            reason="Skip is blocked",
            now=datetime(2026, 11, 7, 10, tzinfo=UTC),
        )
    session.rollback()

    for minute, target in enumerate(("VALIDATED", "PROCESSING", "SETTLED"), start=1):
        transition_payment(
            session,
            payment_id=payment_id,
            target_status=target,
            actor="analyst",
            reason="Verified synthetic step",
            now=datetime(2026, 11, 7, 9, minute, tzinfo=UTC),
        )
        session.commit()

    events = list(
        session.scalars(
            select(PaymentEvent)
            .where(PaymentEvent.payment_id == payment_id)
            .order_by(PaymentEvent.occurred_at, PaymentEvent.event_id)
        )
    )
    assert [item.event_type for item in events] == [
        "IMPORTED",
        "VALIDATED",
        "PROCESSING",
        "SETTLED",
    ]
    assert events[-1].occurred_at >= events[-2].occurred_at
    assert session.get(PaymentInstruction, payment_id).status == "SETTLED"
    assert imported.row_count == 1


@pytest.mark.parametrize(
    ("current_status", "target_status", "allowed"),
    [
        (current, target, target in targets)
        for current, targets in {
            "CREATED": {"VALIDATED"},
            "VALIDATED": {"PROCESSING"},
            "PROCESSING": {"SETTLED", "FAILED"},
            "SETTLED": set(),
            "FAILED": set(),
        }.items()
        for target in ("CREATED", "VALIDATED", "PROCESSING", "SETTLED", "FAILED")
    ],
)
def test_every_defined_payment_transition_is_enforced(
    session: Session, current_status: str, target_status: str, allowed: bool
) -> None:
    import_source_file(
        session,
        file_name="one.csv",
        content=_first_payment_csv(),
        kind="payment_instructions",
    )
    payment_id = session.scalar(select(PaymentInstruction.payment_id))
    assert payment_id is not None
    payment = session.get(PaymentInstruction, payment_id)
    assert payment is not None
    payment.status = current_status
    session.commit()

    if allowed:
        changed = transition_payment(
            session,
            payment_id=payment_id,
            target_status=target_status,
            actor="analyst",
            reason="State matrix test",
            now=datetime(2026, 11, 7, 10, tzinfo=UTC),
        )
        assert changed.status == target_status
    else:
        with pytest.raises(InvalidTransition):
            transition_payment(
                session,
                payment_id=payment_id,
                target_status=target_status,
                actor="analyst",
                reason="Illegal state matrix test",
                now=datetime(2026, 11, 7, 10, tzinfo=UTC),
            )
        session.rollback()
        assert session.get(PaymentInstruction, payment_id).status == current_status


def test_simulation_generates_settlements_and_repeat_does_not_duplicate(session: Session) -> None:
    import_source_file(
        session,
        file_name="normal.csv",
        content=NORMAL_PAYMENTS.read_bytes(),
        kind="payment_instructions",
    )
    failed_id = session.scalar(
        select(PaymentInstruction.payment_id)
        .where(PaymentInstruction.batch_id == "BATCH-N-20261014")
        .order_by(PaymentInstruction.payment_id)
    )
    assert failed_id is not None
    fixed_time = datetime(2026, 11, 7, 12, tzinfo=UTC)

    result = simulate_payment_batch(
        session,
        batch_id="BATCH-N-20261014",
        failed_payment_ids={failed_id},
        now=fixed_time,
    )
    count_after_first_run = session.scalar(select(func.count()).select_from(SettlementRecord))
    retry = simulate_payment_batch(
        session,
        batch_id="BATCH-N-20261014",
        failed_payment_ids={failed_id},
        now=fixed_time,
    )

    assert result["settled_count"] == 99
    assert result["failed_count"] == 1
    assert result["processed_count"] == 300
    assert result["settlement_count"] == 99
    assert retry["idempotent"]
    assert retry["processed_count"] == 0
    assert retry["settlement_count"] == 0
    assert (
        session.scalar(select(func.count()).select_from(SettlementRecord)) == count_after_first_run
    )
    assert session.scalar(select(func.count()).select_from(PaymentEvent)) == 400
    assert (
        session.scalar(
            select(func.count())
            .select_from(SourceFile)
            .where(SourceFile.source_type == "SETTLEMENT")
        )
        == 1
    )


def test_settlement_import_is_idempotent_independently_of_payment_import(
    session: Session,
) -> None:
    settlements = (
        Path(__file__).resolve().parents[2] / "data/synthetic/normal_day/settlement_records.csv"
    )
    content = settlements.read_bytes()
    first = import_source_file(
        session,
        file_name="settlements.csv",
        content=content,
        kind="settlement_records",
    )
    replay = import_source_file(
        session,
        file_name="settlements.csv",
        content=content,
        kind="settlement_records",
    )
    assert first.imported_count == 100
    assert replay.idempotent
    assert replay.imported_count == 0
    assert session.scalar(select(func.count()).select_from(SettlementRecord)) == 100
