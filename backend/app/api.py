from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.models import PaymentEvent, PaymentInstruction, ReconciliationRun, SettlementRecord
from app.schemas.operations import (
    AlertNoteRequest,
    AlertTransitionRequest,
    CaseAssignRequest,
    CaseCreateRequest,
    CaseNoteRequest,
    CaseTransitionRequest,
    ImportResponse,
    MonitoringRunRequest,
    PaymentTransitionRequest,
    PaymentTransitionResponse,
    ReconciliationRunRequest,
    SimulateBatchRequest,
    SimulateBatchResponse,
    SourcePreviewResponse,
)
from app.services.case_management import (
    CaseNotFound,
    InvalidCaseAction,
    add_note,
    assign_case,
    create_case,
    get_case,
    list_cases,
    transition_case,
)
from app.services.csv_validation import DatasetKind
from app.services.monitoring_operations import (
    InvalidAlertAction,
    MonitoringNotFound,
    add_alert_note,
    escalation_summary,
    get_alert,
    list_alerts,
    list_rules,
    run_monitoring,
    transition_alert,
)
from app.services.operational_insights import build_report, report_csv
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


@router.post("/cases", status_code=status.HTTP_201_CREATED)
def open_case(
    payload: CaseCreateRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, Any]:
    try:
        case = create_case(session, payload.result_id, payload.actor, payload.priority)
        session.commit()
        return case
    except CaseNotFound as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except InvalidCaseAction as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.get("/cases")
def cases_queue(
    session: Annotated[Session, Depends(get_session)],
    priority: Annotated[str | None, Query(pattern="^(LOW|NORMAL|HIGH)$")] = None,
    search: Annotated[str | None, Query(max_length=128)] = None,
    case_status: Annotated[
        str | None, Query(alias="status", pattern="^(OPEN|IN_REVIEW|ESCALATED|RESOLVED)$")
    ] = None,
    assigned_to: Annotated[str | None, Query(min_length=1, max_length=128)] = None,
    classification: Annotated[
        str | None,
        Query(
            pattern="^(UNMATCHED_INSTRUCTION|UNMATCHED_SETTLEMENT|AMOUNT_MISMATCH|DUPLICATE_CANDIDATE|AMBIGUOUS_MATCH)$"
        ),
    ] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> dict[str, object]:
    return list_cases(
        session,
        case_status=case_status,
        priority=priority,
        search=search,
        assigned_to=assigned_to,
        classification=classification,
        limit=limit,
        offset=offset,
    )


@router.get("/cases/{case_id}")
def read_case(case_id: str, session: Annotated[Session, Depends(get_session)]) -> dict[str, object]:
    try:
        return get_case(session, case_id)
    except CaseNotFound as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/cases/{case_id}/assignment")
def change_case_assignment(
    case_id: str,
    payload: CaseAssignRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    try:
        result = assign_case(session, case_id, payload.assigned_to, payload.actor)
        session.commit()
        return result
    except CaseNotFound as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except InvalidCaseAction as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.post("/cases/{case_id}/notes")
def write_case_note(
    case_id: str,
    payload: CaseNoteRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    try:
        result = add_note(session, case_id, payload.note, payload.actor)
        session.commit()
        return result
    except CaseNotFound as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except InvalidCaseAction as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.post("/cases/{case_id}/transitions")
def change_case_status(
    case_id: str,
    payload: CaseTransitionRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    try:
        result = transition_case(
            session,
            case_id,
            payload.target_status,
            payload.actor,
            payload.reason,
            payload.root_cause,
        )
        session.commit()
        return result
    except CaseNotFound as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except InvalidCaseAction as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.get("/monitoring/rules")
def monitoring_rules_catalog() -> dict[str, object]:
    return list_rules()


@router.post("/monitoring/runs")
def create_monitoring_run(
    payload: MonitoringRunRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    try:
        result = run_monitoring(session, payload.batch_id, payload.actor)
        session.commit()
        return result
    except MonitoringNotFound as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/monitoring/alerts")
def monitoring_alert_queue(
    session: Annotated[Session, Depends(get_session)],
    alert_status: Annotated[
        str | None, Query(alias="status", pattern="^(OPEN|IN_REVIEW|DISMISSED|ESCALATED)$")
    ] = None,
    severity: Annotated[str | None, Query(pattern="^(INFO|REVIEW|PRIORITY)$")] = None,
    rule_id: Annotated[
        str | None,
        Query(
            pattern="^(HIGH_VALUE_PAYMENT|PAYER_VELOCITY|REPEATED_FAILURES|DUPLICATE_REFERENCE)$"
        ),
    ] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> dict[str, object]:
    return list_alerts(
        session,
        alert_status=alert_status,
        severity=severity,
        rule_id=rule_id,
        limit=limit,
        offset=offset,
    )


@router.get("/monitoring/alerts/{alert_id}")
def monitoring_alert_detail(
    alert_id: str,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    try:
        return get_alert(session, alert_id)
    except MonitoringNotFound as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/monitoring/alerts/{alert_id}/transitions")
def review_monitoring_alert(
    alert_id: str,
    payload: AlertTransitionRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    try:
        result = transition_alert(
            session,
            alert_id,
            payload.target_status,
            payload.actor,
            payload.reason,
        )
        session.commit()
        return result
    except MonitoringNotFound as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except InvalidAlertAction as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.post("/monitoring/alerts/{alert_id}/notes")
def note_monitoring_alert(
    alert_id: str,
    payload: AlertNoteRequest,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    try:
        result = add_alert_note(session, alert_id, payload.actor, payload.note)
        session.commit()
        return result
    except MonitoringNotFound as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except InvalidAlertAction as error:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.get("/monitoring/alerts/{alert_id}/escalation-summary")
def get_escalation_summary(
    alert_id: str,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    try:
        return escalation_summary(session, alert_id)
    except MonitoringNotFound as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except InvalidAlertAction as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.get("/insights/latest")
def latest_operational_insights(
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    run = session.scalar(
        select(ReconciliationRun)
        .order_by(ReconciliationRun.finished_at.desc(), ReconciliationRun.run_id)
        .limit(1)
    )
    if run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Run a reconciliation before viewing operational insights.",
        )
    return build_report(session, run.run_id)


@router.get("/insights/runs/{run_id}")
def operational_insights_for_run(
    run_id: str,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, object]:
    try:
        return build_report(session, run_id)
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/insights/runs/{run_id}/export.csv")
def export_operational_insights(
    run_id: str,
    session: Annotated[Session, Depends(get_session)],
) -> Response:
    try:
        report = build_report(session, run_id)
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    return Response(
        content=report_csv(report),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="fireops-insights-{run_id}.csv"'},
    )


def install_routes(app: Any) -> None:
    app.include_router(router)
