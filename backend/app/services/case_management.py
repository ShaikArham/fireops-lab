from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    CaseActivity,
    ExceptionCase,
    PaymentInstruction,
    ReconciliationResult,
    SettlementRecord,
)

EXCEPTION_CLASSES = {
    "UNMATCHED_INSTRUCTION",
    "UNMATCHED_SETTLEMENT",
    "AMOUNT_MISMATCH",
    "DUPLICATE_CANDIDATE",
    "AMBIGUOUS_MATCH",
}
TRANSITIONS = {
    "OPEN": {"IN_REVIEW", "ESCALATED", "RESOLVED"},
    "IN_REVIEW": {"ESCALATED", "RESOLVED"},
    "ESCALATED": {"IN_REVIEW", "RESOLVED"},
    "RESOLVED": {"OPEN"},
}


class CaseNotFound(LookupError):
    pass


class InvalidCaseAction(ValueError):
    pass


def _activity(
    session: Session,
    case_id: str,
    activity_type: str,
    actor: str,
    *,
    reason: str | None = None,
    from_value: str | None = None,
    to_value: str | None = None,
) -> None:
    session.add(
        CaseActivity(
            activity_id=str(uuid4()),
            case_id=case_id,
            activity_type=activity_type,
            occurred_at=datetime.now(UTC),
            actor=actor,
            reason=reason,
            from_value=from_value,
            to_value=to_value,
            correlation_id=str(uuid4()),
        )
    )


def _case_data(
    session: Session, case: ExceptionCase, include_activities: bool
) -> dict[str, object]:
    result = session.get(ReconciliationResult, case.result_id)
    if result is None:  # protected by the foreign key; defensive for damaged databases
        raise CaseNotFound("The linked reconciliation result no longer exists.")
    payment = session.get(PaymentInstruction, result.payment_id) if result.payment_id else None
    settlement = (
        session.get(SettlementRecord, result.settlement_id) if result.settlement_id else None
    )
    data: dict[str, object] = {
        "case_id": case.case_id,
        "result_id": result.result_id,
        "run_id": result.run_id,
        "classification": result.classification,
        "explanation_code": result.explanation_code,
        "difference_minor": result.difference_minor,
        "status": case.status,
        "priority": case.priority,
        "assigned_to": case.assigned_to,
        "created_at": case.created_at,
        "updated_at": case.updated_at,
        "resolved_at": case.resolved_at,
        "version": case.version,
        "payment": (
            {
                "payment_id": payment.payment_id,
                "client_reference": payment.client_reference,
                "amount_minor": payment.amount_minor,
                "currency": payment.currency,
                "expected_settlement_date": payment.expected_settlement_date,
            }
            if payment
            else None
        ),
        "settlement": (
            {
                "settlement_id": settlement.settlement_id,
                "payment_reference": settlement.payment_reference,
                "amount_minor": settlement.amount_minor,
                "currency": settlement.currency,
                "settlement_date": settlement.settlement_date,
            }
            if settlement
            else None
        ),
    }
    if include_activities:
        activities = session.scalars(
            select(CaseActivity)
            .where(CaseActivity.case_id == case.case_id)
            .order_by(CaseActivity.occurred_at, CaseActivity.activity_id)
        )
        data["activities"] = [
            {
                "activity_id": item.activity_id,
                "activity_type": item.activity_type,
                "occurred_at": item.occurred_at,
                "actor": item.actor,
                "reason": item.reason,
                "from_value": item.from_value,
                "to_value": item.to_value,
                "correlation_id": item.correlation_id,
            }
            for item in activities
        ]
    return data


def create_case(session: Session, result_id: str, actor: str, priority: str) -> dict[str, object]:
    result = session.get(ReconciliationResult, result_id)
    if result is None:
        raise CaseNotFound("Reconciliation result not found.")
    if result.classification not in EXCEPTION_CLASSES:
        raise InvalidCaseAction("Cases can only be opened for a reconciliation exception.")
    if session.scalar(select(ExceptionCase).where(ExceptionCase.result_id == result_id)):
        raise InvalidCaseAction("A case already exists for this reconciliation result.")
    now = datetime.now(UTC)
    case = ExceptionCase(
        case_id=str(uuid4()),
        result_id=result_id,
        status="OPEN",
        priority=priority,
        assigned_to=None,
        created_at=now,
        updated_at=now,
        resolved_at=None,
        version=1,
    )
    session.add(case)
    session.flush()
    _activity(session, case.case_id, "CREATED", actor, to_value="OPEN")
    session.flush()
    return _case_data(session, case, include_activities=True)


def list_cases(
    session: Session,
    *,
    case_status: str | None,
    assigned_to: str | None,
    classification: str | None,
    limit: int,
    offset: int,
) -> dict[str, object]:
    statement = select(ExceptionCase).join(
        ReconciliationResult, ExceptionCase.result_id == ReconciliationResult.result_id
    )
    if case_status:
        statement = statement.where(ExceptionCase.status == case_status)
    if assigned_to:
        statement = statement.where(ExceptionCase.assigned_to == assigned_to)
    if classification:
        statement = statement.where(ReconciliationResult.classification == classification)
    cases = session.scalars(
        statement.order_by(ExceptionCase.updated_at.desc(), ExceptionCase.case_id)
        .limit(limit)
        .offset(offset)
    )
    items = [_case_data(session, case, include_activities=False) for case in cases]
    return {"cases": items, "limit": limit, "offset": offset}


def get_case(session: Session, case_id: str) -> dict[str, object]:
    case = session.get(ExceptionCase, case_id)
    if case is None:
        raise CaseNotFound("Case not found.")
    return _case_data(session, case, include_activities=True)


def assign_case(
    session: Session, case_id: str, assigned_to: str | None, actor: str
) -> dict[str, object]:
    case = session.get(ExceptionCase, case_id)
    if case is None:
        raise CaseNotFound("Case not found.")
    if case.status == "RESOLVED":
        raise InvalidCaseAction("Reopen the case before changing its owner.")
    previous = case.assigned_to
    if previous == assigned_to:
        raise InvalidCaseAction("The case is already assigned to that analyst.")
    case.assigned_to = assigned_to
    case.updated_at = datetime.now(UTC)
    case.version += 1
    _activity(session, case_id, "ASSIGNED", actor, from_value=previous, to_value=assigned_to)
    session.flush()
    return _case_data(session, case, include_activities=True)


def add_note(session: Session, case_id: str, note: str, actor: str) -> dict[str, object]:
    case = session.get(ExceptionCase, case_id)
    if case is None:
        raise CaseNotFound("Case not found.")
    if case.status == "RESOLVED":
        raise InvalidCaseAction("Reopen the case before adding an investigation note.")
    case.updated_at = datetime.now(UTC)
    case.version += 1
    _activity(session, case_id, "NOTE_ADDED", actor, reason=note)
    session.flush()
    return _case_data(session, case, include_activities=True)


def transition_case(
    session: Session,
    case_id: str,
    target_status: str,
    actor: str,
    reason: str | None,
) -> dict[str, object]:
    case = session.get(ExceptionCase, case_id)
    if case is None:
        raise CaseNotFound("Case not found.")
    previous = case.status
    if target_status not in TRANSITIONS[previous]:
        raise InvalidCaseAction(f"Transition from {previous} to {target_status} is not allowed.")
    if target_status in {"ESCALATED", "RESOLVED"} and not reason:
        raise InvalidCaseAction("A reason is required for escalation and resolution.")
    if previous == "RESOLVED" and (target_status != "OPEN" or not reason):
        raise InvalidCaseAction("Reopening a resolved case requires a justification.")
    if target_status == "ESCALATED":
        activity_type = "ESCALATED"
    elif target_status == "RESOLVED":
        activity_type = "RESOLVED"
    elif previous == "RESOLVED":
        activity_type = "REOPENED"
    else:
        activity_type = "STATUS_CHANGED"
    now = datetime.now(UTC)
    case.status = target_status
    case.updated_at = now
    case.resolved_at = now if target_status == "RESOLVED" else None
    case.version += 1
    _activity(
        session,
        case_id,
        activity_type,
        actor,
        reason=reason,
        from_value=previous,
        to_value=target_status,
    )
    session.flush()
    return _case_data(session, case, include_activities=True)
