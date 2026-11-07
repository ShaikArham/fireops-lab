from __future__ import annotations

from collections import Counter, defaultdict
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PaymentInstruction, ReconciliationResult, ReconciliationRun, SettlementRecord
from app.services.reconciliation import RULES_VERSION, reconcile, stable_hash


def _payment_data(row: PaymentInstruction) -> dict[str, object]:
    return {
        "payment_id": row.payment_id,
        "client_reference": row.client_reference,
        "amount_minor": row.amount_minor,
        "currency": row.currency,
        "direction": row.direction,
        "expected_settlement_date": row.expected_settlement_date,
        "batch_id": row.batch_id,
    }


def _settlement_data(row: SettlementRecord) -> dict[str, object]:
    return {
        "settlement_id": row.settlement_id,
        "payment_reference": row.payment_reference,
        "amount_minor": row.amount_minor,
        "currency": row.currency,
        "direction": row.direction,
        "settlement_date": row.settlement_date,
        "settlement_batch_id": row.settlement_batch_id,
    }


def run_reconciliation(
    session: Session, payment_batch_id: str, settlement_batch_id: str, late_window_days: int
) -> dict[str, object]:
    started = datetime.now(UTC)
    payments_db = list(
        session.scalars(
            select(PaymentInstruction)
            .where(PaymentInstruction.batch_id == payment_batch_id)
            .order_by(PaymentInstruction.payment_id)
        )
    )
    if not payments_db:
        raise LookupError("Payment batch not found or empty.")
    statement = (
        select(SettlementRecord)
        .where(SettlementRecord.settlement_batch_id == settlement_batch_id)
        .order_by(SettlementRecord.settlement_id)
    )
    settlements_db = list(session.scalars(statement))
    payments = [_payment_data(row) for row in payments_db]
    settlements = [_settlement_data(row) for row in settlements_db]
    rows = reconcile(payments, settlements, late_window_days)
    counts = Counter(row.classification for row in rows)
    mismatch_totals: dict[str, int] = defaultdict(int)
    payment_by_id = {row.payment_id: row for row in payments_db}
    for row in rows:
        if row.classification == "AMOUNT_MISMATCH" and row.payment_id:
            mismatch_totals[payment_by_id[row.payment_id].currency] += row.difference_minor or 0
    run_id = str(uuid4())
    run = ReconciliationRun(
        run_id=run_id,
        payment_batch_id=payment_batch_id,
        settlement_batch_id=settlement_batch_id,
        rules_version=RULES_VERSION,
        started_at=started,
        finished_at=datetime.now(UTC),
        status="COMPLETED",
        input_hashes={
            "payments": stable_hash(
                payments,
                (
                    "payment_id",
                    "client_reference",
                    "amount_minor",
                    "currency",
                    "direction",
                    "expected_settlement_date",
                    "batch_id",
                ),
            ),
            "settlements": stable_hash(
                settlements,
                (
                    "settlement_id",
                    "payment_reference",
                    "amount_minor",
                    "currency",
                    "direction",
                    "settlement_date",
                    "settlement_batch_id",
                ),
            ),
        },
        classification_counts=dict(sorted(counts.items())),
        amount_mismatch_totals_minor=dict(sorted(mismatch_totals.items())),
        matched_count=counts["MATCHED_EXACT"] + counts["MATCHED_LATE"],
        unmatched_count=counts["UNMATCHED_INSTRUCTION"] + counts["UNMATCHED_SETTLEMENT"],
        exception_count=sum(
            value for key, value in counts.items() if key not in {"MATCHED_EXACT", "MATCHED_LATE"}
        ),
        result_count=len(rows),
    )
    session.add(run)
    session.flush()
    for row in rows:
        session.add(ReconciliationResult(result_id=str(uuid4()), run_id=run_id, **row.__dict__))
    session.commit()
    return get_run(session, run_id, limit=100, offset=0)


def get_run(session: Session, run_id: str, limit: int = 100, offset: int = 0) -> dict[str, object]:
    run = session.get(ReconciliationRun, run_id)
    if run is None:
        raise LookupError("Reconciliation run not found.")
    results = list(
        session.scalars(
            select(ReconciliationResult)
            .where(ReconciliationResult.run_id == run_id)
            .order_by(
                ReconciliationResult.classification,
                ReconciliationResult.payment_id,
                ReconciliationResult.settlement_id,
            )
            .limit(limit)
            .offset(offset)
        )
    )
    payment_ids = {result.payment_id for result in results if result.payment_id}
    settlement_ids = {result.settlement_id for result in results if result.settlement_id}
    payments = (
        {
            p.payment_id: p
            for p in session.scalars(
                select(PaymentInstruction).where(PaymentInstruction.payment_id.in_(payment_ids))
            )
        }
        if payment_ids
        else {}
    )
    settlements = (
        {
            s.settlement_id: s
            for s in session.scalars(
                select(SettlementRecord).where(SettlementRecord.settlement_id.in_(settlement_ids))
            )
        }
        if settlement_ids
        else {}
    )
    return {
        "run_id": run.run_id,
        "payment_batch_id": run.payment_batch_id,
        "settlement_batch_id": run.settlement_batch_id,
        "rules_version": run.rules_version,
        "started_at": run.started_at,
        "finished_at": run.finished_at,
        "status": run.status,
        "input_hashes": run.input_hashes,
        "classification_counts": run.classification_counts,
        "amount_mismatch_totals_minor": run.amount_mismatch_totals_minor,
        "matched_count": run.matched_count,
        "unmatched_count": run.unmatched_count,
        "exception_count": run.exception_count,
        "result_count": run.result_count,
        "limit": limit,
        "offset": offset,
        "results": [
            {
                "result_id": r.result_id,
                "classification": r.classification,
                "difference_minor": r.difference_minor,
                "explanation_code": r.explanation_code,
                "match_method": r.match_method,
                "payment": _payment_data(payments[r.payment_id]) if r.payment_id else None,
                "settlement": _settlement_data(settlements[r.settlement_id])
                if r.settlement_id
                else None,
            }
            for r in results
        ],
    }
