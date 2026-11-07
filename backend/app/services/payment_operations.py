import csv
import hashlib
import io
import uuid
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from pathlib import PurePath
from typing import Any

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import PaymentEvent, PaymentInstruction, SettlementRecord, SourceFile
from app.schemas.records import PaymentInstructionRow, SettlementRecordRow
from app.services.csv_validation import CSVValidationResult, DatasetKind, validate_csv

SOURCE_TYPES = {
    "payment_instructions": "PAYMENT_INSTRUCTION",
    "settlement_records": "SETTLEMENT",
}
STATUS_TRANSITIONS = {
    "CREATED": {"VALIDATED"},
    "VALIDATED": {"PROCESSING"},
    "PROCESSING": {"SETTLED", "FAILED"},
    "SETTLED": set(),
    "FAILED": set(),
}


class ImportRejected(Exception):
    def __init__(self, validation: CSVValidationResult) -> None:
        self.validation = validation
        super().__init__("The complete source file failed validation.")


class ImportConflict(Exception):
    pass


class InvalidTransition(Exception):
    pass


class UnknownPayment(Exception):
    pass


class UnknownBatch(Exception):
    pass


@dataclass(frozen=True)
class ImportReceipt:
    source_file_id: str
    source_type: str
    checksum_sha256: str
    row_count: int
    imported_count: int
    idempotent: bool


def _safe_file_name(file_name: str) -> str:
    name = PurePath(file_name.replace("\\", "/")).name.strip()
    if not name or len(name) > 255 or "\x00" in name:
        raise ValueError("file_name must be a non-empty filename of at most 255 characters")
    return name


def preview_source_file(
    content: bytes, kind: DatasetKind
) -> tuple[CSVValidationResult, list[dict[str, Any]]]:
    validation = validate_csv(content, kind)
    preview = [record.model_dump(mode="json") for record in validation.records[:25]]
    return validation, preview


def import_source_file(
    session: Session,
    *,
    file_name: str,
    content: bytes,
    kind: DatasetKind,
    now: datetime | None = None,
) -> ImportReceipt:
    safe_name = _safe_file_name(file_name)
    validation = validate_csv(content, kind)
    if not validation.is_valid:
        raise ImportRejected(validation)

    source_type = SOURCE_TYPES[kind]
    existing = session.scalar(
        select(SourceFile).where(
            SourceFile.checksum_sha256 == validation.checksum_sha256,
            SourceFile.source_type == source_type,
        )
    )
    if existing is not None:
        return ImportReceipt(
            existing.source_file_id,
            source_type,
            validation.checksum_sha256,
            existing.row_count,
            0,
            True,
        )

    uploaded_at = now or datetime.now(UTC)
    if uploaded_at.tzinfo is None or uploaded_at.utcoffset() is None:
        raise ValueError("now must be timezone-aware")
    source_file_id = str(uuid.uuid4())
    try:
        source_file = SourceFile(
            source_file_id=source_file_id,
            file_name=safe_name,
            checksum_sha256=validation.checksum_sha256,
            uploaded_at=uploaded_at.astimezone(UTC),
            row_count=validation.data_row_count,
            validation_status="VALID",
            source_type=source_type,
        )
        session.add(source_file)
        session.flush()
        if kind == "payment_instructions":
            _insert_payment_instructions(session, validation.records, source_file_id, uploaded_at)
        else:
            _insert_settlements(session, validation.records, source_file_id)
        session.commit()
    except IntegrityError as error:
        session.rollback()
        existing = session.scalar(
            select(SourceFile).where(
                SourceFile.checksum_sha256 == validation.checksum_sha256,
                SourceFile.source_type == source_type,
            )
        )
        if existing is not None:
            return ImportReceipt(
                existing.source_file_id,
                source_type,
                validation.checksum_sha256,
                existing.row_count,
                0,
                True,
            )
        raise ImportConflict(
            "The file contains an identifier already used by another import; nothing was saved."
        ) from error

    return ImportReceipt(
        source_file_id,
        source_type,
        validation.checksum_sha256,
        validation.data_row_count,
        validation.data_row_count,
        False,
    )


def _insert_payment_instructions(
    session: Session,
    records: tuple[BaseModel, ...],
    source_file_id: str,
    uploaded_at: datetime,
) -> None:
    for raw_record in records:
        if not isinstance(raw_record, PaymentInstructionRow):
            raise TypeError("Unexpected payment instruction record type")
        values = raw_record.model_dump()
        session.add(PaymentInstruction(**values, source_file_id=source_file_id))

    session.flush()
    for raw_record in records:
        session.add(
            PaymentEvent(
                event_id=str(uuid.uuid4()),
                payment_id=raw_record.payment_id,
                event_type="IMPORTED",
                occurred_at=max(uploaded_at.astimezone(UTC), raw_record.created_at),
                metadata_json={
                    "source_file_id": source_file_id,
                    "initial_status": raw_record.status,
                },
                actor="system:synthetic-import",
                correlation_id=source_file_id,
            )
        )


def _insert_settlements(
    session: Session, records: tuple[BaseModel, ...], source_file_id: str
) -> None:
    for raw_record in records:
        if not isinstance(raw_record, SettlementRecordRow):
            raise TypeError("Unexpected settlement record type")
        session.add(SettlementRecord(**raw_record.model_dump(), source_file_id=source_file_id))


def transition_payment(
    session: Session,
    *,
    payment_id: str,
    target_status: str,
    actor: str,
    reason: str,
    now: datetime | None = None,
) -> PaymentInstruction:
    payment = session.get(PaymentInstruction, payment_id)
    if payment is None:
        raise UnknownPayment(payment_id)
    if target_status not in STATUS_TRANSITIONS.get(payment.status, set()):
        raise InvalidTransition(f"{payment.status} cannot transition to {target_status}.")
    event_time = now or datetime.now(UTC)
    if event_time.tzinfo is None or event_time.utcoffset() is None:
        raise ValueError("now must be timezone-aware")
    previous_event = session.scalar(
        select(PaymentEvent)
        .where(PaymentEvent.payment_id == payment_id)
        .order_by(PaymentEvent.occurred_at.desc(), PaymentEvent.event_id.desc())
        .limit(1)
    )
    if previous_event is not None:
        previous_time = previous_event.occurred_at
        if previous_time.tzinfo is None:
            previous_time = previous_time.replace(tzinfo=UTC)
        event_time = max(event_time, previous_time + timedelta(microseconds=1))
    payment.status = target_status
    session.add(
        PaymentEvent(
            event_id=str(uuid.uuid4()),
            payment_id=payment_id,
            event_type=target_status,
            occurred_at=event_time.astimezone(UTC),
            metadata_json={"reason": reason.strip()},
            actor=actor.strip(),
            correlation_id=payment.batch_id,
        )
    )
    session.flush()
    return payment


def _simulated_settlement(payment: PaymentInstruction, settlement_date: date) -> SettlementRecord:
    identity = hashlib.sha256(payment.payment_id.encode("utf-8")).hexdigest()[:32].upper()
    batch_hash = hashlib.sha256(
        f"{payment.batch_id}:{settlement_date.isoformat()}".encode()
    ).hexdigest()[:20].upper()
    return SettlementRecord(
        settlement_id=f"SIMSET-{identity}",
        scheme_reference=f"SIMREF-{identity}",
        payment_reference=payment.client_reference,
        settlement_date=settlement_date,
        amount_minor=payment.amount_minor,
        currency=payment.currency,
        direction=payment.direction,
        settlement_batch_id=f"SIMB-{batch_hash}",
        source_file_id="",  # Assigned after the deterministic file checksum is known.
    )


def _settlements_csv(settlements: list[SettlementRecord]) -> bytes:
    fields = (
        "settlement_id",
        "scheme_reference",
        "payment_reference",
        "settlement_date",
        "amount_minor",
        "currency",
        "direction",
        "settlement_batch_id",
    )
    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=fields, lineterminator="\n")
    writer.writeheader()
    for settlement in settlements:
        writer.writerow(
            {
                "settlement_id": settlement.settlement_id,
                "scheme_reference": settlement.scheme_reference,
                "payment_reference": settlement.payment_reference,
                "settlement_date": settlement.settlement_date.isoformat(),
                "amount_minor": settlement.amount_minor,
                "currency": settlement.currency,
                "direction": settlement.direction,
                "settlement_batch_id": settlement.settlement_batch_id,
            }
        )
    return buffer.getvalue().encode("utf-8")


def simulate_payment_batch(
    session: Session,
    *,
    batch_id: str,
    failed_payment_ids: set[str] | None = None,
    actor: str = "system:simulation",
    now: datetime | None = None,
) -> dict[str, Any]:
    payments = list(
        session.scalars(
            select(PaymentInstruction)
            .where(PaymentInstruction.batch_id == batch_id)
            .order_by(PaymentInstruction.payment_id)
        )
    )
    if not payments:
        raise UnknownBatch(batch_id)
    requested_failures = failed_payment_ids or set()
    payment_ids = {payment.payment_id for payment in payments}
    if not requested_failures <= payment_ids:
        raise ValueError("Every simulated failure must belong to the selected batch.")

    event_time = now or datetime.now(UTC)
    if event_time.tzinfo is None or event_time.utcoffset() is None:
        raise ValueError("now must be timezone-aware")

    settlements: list[SettlementRecord] = []
    updated_count = 0
    for payment in payments:
        if payment.status in {"SETTLED", "FAILED"}:
            continue
        while payment.status in {"CREATED", "VALIDATED", "PROCESSING"}:
            if payment.status == "CREATED":
                target = "VALIDATED"
            elif payment.status == "VALIDATED":
                target = "PROCESSING"
            else:
                target = "FAILED" if payment.payment_id in requested_failures else "SETTLED"
            transition_payment(
                session,
                payment_id=payment.payment_id,
                target_status=target,
                actor=actor,
                reason="Deterministic synthetic payment simulation.",
                now=event_time,
            )
            updated_count += 1
        if payment.status == "SETTLED":
            settlements.append(_simulated_settlement(payment, payment.expected_settlement_date))

    if settlements:
        settlement_csv = _settlements_csv(settlements)
        checksum = hashlib.sha256(settlement_csv).hexdigest()
        existing_source = session.scalar(
            select(SourceFile).where(
                SourceFile.checksum_sha256 == checksum,
                SourceFile.source_type == "SETTLEMENT",
            )
        )
        if existing_source is None:
            source_file_id = str(uuid.uuid4())
            session.add(
                SourceFile(
                    source_file_id=source_file_id,
                    file_name=f"simulated_{batch_id}.csv",
                    checksum_sha256=checksum,
                    uploaded_at=event_time.astimezone(UTC),
                    row_count=len(settlements),
                    validation_status="VALID",
                    source_type="SETTLEMENT",
                )
            )
            session.flush()
            for settlement in settlements:
                settlement.source_file_id = source_file_id
                session.add(settlement)
        else:
            # A checksum duplicate is an idempotent replay. Do not count these records again.
            settlements = []

    session.commit()

    currency_totals: dict[str, int] = defaultdict(int)
    for settlement in settlements:
        currency_totals[settlement.currency] += settlement.amount_minor
    return {
        "batch_id": batch_id,
        "processed_count": updated_count,
        "settled_count": len(settlements),
        "failed_count": sum(payment.status == "FAILED" for payment in payments),
        "settlement_count": len(settlements),
        "settlement_totals_minor": dict(sorted(currency_totals.items())),
        "idempotent": updated_count == 0,
    }
