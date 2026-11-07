from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.models import PaymentEvent, PaymentInstruction, SettlementRecord
from app.schemas.operations import (
    ImportResponse,
    PaymentTransitionRequest,
    PaymentTransitionResponse,
    ReconciliationRunRequest,
    SimulateBatchRequest,
    SimulateBatchResponse,
    SourcePreviewResponse,
)
from app.services.csv_validation import DatasetKind
from app.services.payment_operations import (
    ImportConflict,
    ImportRejected,
    InvalidTransition,
    UnknownBatch,
    UnknownPayment,
    import_source_file,
    preview_source_file,
    simulate_payment_batch,
    transition_payment,
)
from app.services.reconciliation_operations import get_run, run_reconciliation

router = APIRouter(prefix="/api/v1", tags=["payment operations"])
MAX_IMPORT_BYTES = 5 * 1024 * 1024


async def _read_csv(request: Request) -> bytes:
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > MAX_IMPORT_BYTES:
        raise HTTPException(
            status.HTTP_413_CONTENT_TOO_LARGE,
            "File exceeds the 5 MiB limit.",
        )
    chunks: list[bytes] = []
    total_bytes = 0
    async for chunk in request.stream():
        total_bytes += len(chunk)
        if total_bytes > MAX_IMPORT_BYTES:
            raise HTTPException(
                status.HTTP_413_CONTENT_TOO_LARGE,
                "File exceeds the 5 MiB limit.",
            )
        chunks.append(chunk)
    return b"".join(chunks)


@router.post("/source-files/preview", response_model=SourcePreviewResponse)
async def preview_source(
    request: Request,
    kind: Annotated[DatasetKind, Query()],
) -> dict[str, Any]:
    content = await _read_csv(request)
    validation, preview = preview_source_file(content, kind)
    return {
        "kind": validation.kind,
        "checksum_sha256": validation.checksum_sha256,
        "data_row_count": validation.data_row_count,
        "is_valid": validation.is_valid,
        "issues_truncated": validation.issues_truncated,
        "issues": [issue.__dict__ for issue in validation.issues],
        "preview": preview,
    }


@router.post("/source-files/import/{kind}", response_model=ImportResponse)
async def import_source(
    kind: DatasetKind,
    request: Request,
    session: Annotated[Session, Depends(get_session)],
    file_name: Annotated[str, Query(min_length=1, max_length=255)] = "synthetic.csv",
) -> dict[str, Any]:
    content = await _read_csv(request)
    try:
        receipt = import_source_file(session, file_name=file_name, content=content, kind=kind)
    except ImportRejected as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "message": str(error),
                "issues": [issue.__dict__ for issue in error.validation.issues],
                "issues_truncated": error.validation.issues_truncated,
            },
        ) from error
    except ImportConflict as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error
    return {
        "source_file_id": receipt.source_file_id,
        "source_type": receipt.source_type,
        "checksum_sha256": receipt.checksum_sha256,
        "row_count": receipt.row_count,
        "imported_count": receipt.imported_count,
        "idempotent": receipt.idempotent,
    }


@router.get("/batches")
def list_payment_batches(
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, list[dict[str, Any]]]:
    rows = session.execute(
        select(
            PaymentInstruction.batch_id,
            PaymentInstruction.currency,
            PaymentInstruction.direction,
            PaymentInstruction.status,
            func.count(PaymentInstruction.payment_id).label("record_count"),
            func.sum(PaymentInstruction.amount_minor).label("total_minor"),
        )
        .group_by(
            PaymentInstruction.batch_id,
            PaymentInstruction.currency,
            PaymentInstruction.direction,
            PaymentInstruction.status,
        )
        .order_by(
            PaymentInstruction.batch_id,
            PaymentInstruction.currency,
            PaymentInstruction.status,
        )
    )
    batches: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        batches.setdefault(row.batch_id, []).append(
            {
                "currency": row.currency,
                "direction": row.direction,
                "status": row.status,
                "record_count": row.record_count,
                "total_minor": row.total_minor,
            }
        )
    settlement_rows = session.execute(
        select(
            SettlementRecord.settlement_batch_id,
            SettlementRecord.currency,
            SettlementRecord.direction,
            func.count(SettlementRecord.settlement_id).label("record_count"),
            func.sum(SettlementRecord.amount_minor).label("total_minor"),
        )
        .group_by(
            SettlementRecord.settlement_batch_id,
            SettlementRecord.currency,
            SettlementRecord.direction,
        )
        .order_by(
            SettlementRecord.settlement_batch_id,
            SettlementRecord.currency,
            SettlementRecord.direction,
        )
    )
    settlement_batches: dict[str, list[dict[str, Any]]] = {}
    for row in settlement_rows:
        settlement_batches.setdefault(row.settlement_batch_id, []).append(
            {
                "currency": row.currency,
                "direction": row.direction,
                "record_count": row.record_count,
                "total_minor": row.total_minor,
            }
        )
    return {
        "batches": [
            {"batch_id": batch_id, "control_totals": totals}
            for batch_id, totals in sorted(batches.items())
        ],
        "settlement_batches": [
            {"settlement_batch_id": batch_id, "control_totals": totals}
            for batch_id, totals in sorted(settlement_batches.items())
        ],
    }


@router.get("/batches/{batch_id}/payments")
def list_batch_payments(
    batch_id: str,
    session: Annotated[Session, Depends(get_session)],
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
) -> dict[str, Any]:
    payments = session.scalars(
        select(PaymentInstruction)
        .where(PaymentInstruction.batch_id == batch_id)
        .order_by(PaymentInstruction.payment_id)
        .limit(limit)
    )
    records = [
        {
            "payment_id": payment.payment_id,
            "client_reference": payment.client_reference,
            "status": payment.status,
            "amount_minor": payment.amount_minor,
            "currency": payment.currency,
            "direction": payment.direction,
        }
        for payment in payments
    ]
    return {"batch_id": batch_id, "payments": records, "limit": limit}


@router.post("/batches/{batch_id}/simulate", response_model=SimulateBatchResponse)
def simulate_batch(
    batch_id: str,
    payload: SimulateBatchRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    try:
        return simulate_payment_batch(
            session,
            batch_id=batch_id,
            failed_payment_ids=set(payload.failed_payment_ids),
            actor=payload.actor,
        )
    except UnknownBatch as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment batch not found.",
        ) from error
    except ValueError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error


@router.post("/payments/{payment_id}/transitions", response_model=PaymentTransitionResponse)
def change_payment_status(
    payment_id: str,
    payload: PaymentTransitionRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, str]:
    try:
        payment = transition_payment(
            session,
            payment_id=payment_id,
            target_status=payload.target_status,
            actor=payload.actor,
            reason=payload.reason,
        )
        session.commit()
    except UnknownPayment as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        ) from error
    except InvalidTransition as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except ValueError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error
    return {
        "payment_id": payment.payment_id,
        "status": payment.status,
        "batch_id": payment.batch_id,
    }


@router.get("/payments/{payment_id}/events")
def payment_event_history(
    payment_id: str, session: Annotated[Session, Depends(get_session)]
) -> dict[str, list[dict[str, Any]]]:
    if session.get(PaymentInstruction, payment_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found.")
    events = session.scalars(
        select(PaymentEvent)
        .where(PaymentEvent.payment_id == payment_id)
        .order_by(PaymentEvent.occurred_at, PaymentEvent.event_id)
    )
    return {
        "events": [
            {
                "event_id": event.event_id,
                "payment_id": event.payment_id,
                "event_type": event.event_type,
                "occurred_at": event.occurred_at,
                "metadata": event.metadata_json,
                "actor": event.actor,
                "correlation_id": event.correlation_id,
            }
            for event in events
        ]
    }


@router.post("/reconciliation/runs", status_code=status.HTTP_201_CREATED)
def create_reconciliation_run(
    payload: ReconciliationRunRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    try:
        return run_reconciliation(
            session,
            payload.payment_batch_id,
            payload.settlement_batch_id,
            payload.late_window_days,
        )
    except LookupError as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ValueError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error)
        ) from error


@router.get("/reconciliation/runs/{run_id}")
def read_reconciliation_run(
    run_id: str,
    session: Annotated[Session, Depends(get_session)],
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> dict[str, Any]:
    try:
        return get_run(session, run_id, limit, offset)
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


def install_routes(app: Any) -> None:
    app.include_router(router)
