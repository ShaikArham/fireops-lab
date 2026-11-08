from __future__ import annotations

import hashlib
import json
from collections import Counter
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    MonitoringActivity,
    MonitoringAlert,
    MonitoringRun,
    PaymentEvent,
    PaymentInstruction,
)
from app.services.monitoring_rules import RULE_CATALOG, RULES_VERSION, evaluate_monitoring

ALERT_TRANSITIONS = {
    "OPEN": {"IN_REVIEW"},
    "IN_REVIEW": {"DISMISSED", "ESCALATED"},
    "DISMISSED": set(),
    "ESCALATED": set(),
}


class MonitoringNotFound(LookupError):
    pass


class InvalidAlertAction(ValueError):
    pass


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _event_record(event: PaymentEvent) -> dict[str, object]:
    return {
        "event_id": event.event_id,
        "payment_id": event.payment_id,
        "event_type": event.event_type,
        "occurred_at": _utc(event.occurred_at).isoformat(),
        "metadata": event.metadata_json,
    }


def _payment_record(payment: PaymentInstruction) -> dict[str, object]:
    return {
        "payment_id": payment.payment_id,
        "client_reference": payment.client_reference,
        "instructed_at": _utc(payment.instructed_at).isoformat(),
        "amount_minor": payment.amount_minor,
        "currency": payment.currency,
        "payer_account_token": payment.payer_account_token,
        "status": payment.status,
    }


def _write_activity(
    session: Session,
    alert_id: str,
    activity_type: str,
    actor: str,
    *,
    reason: str | None = None,
    from_status: str | None = None,
    to_status: str | None = None,
) -> None:
    session.add(
        MonitoringActivity(
            activity_id=str(uuid4()),
            alert_id=alert_id,
            activity_type=activity_type,
            occurred_at=datetime.now(UTC),
            actor=actor,
            reason=reason,
            from_status=from_status,
            to_status=to_status,
            correlation_id=str(uuid4()),
        )
    )


def _alert_data(session: Session, alert: MonitoringAlert) -> dict[str, object]:
    activities = session.scalars(
        select(MonitoringActivity)
        .where(MonitoringActivity.alert_id == alert.alert_id)
        .order_by(MonitoringActivity.occurred_at, MonitoringActivity.activity_id)
    )
    return {
        "alert_id": alert.alert_id,
        "run_id": alert.run_id,
        "rule_id": alert.rule_id,
        "group_key": alert.group_key,
        "title": alert.title,
        "severity": alert.severity,
        "status": alert.status,
        "explanation": alert.explanation,
        "threshold": alert.threshold,
        "false_positive_example": alert.false_positive_example,
        "evidence": alert.evidence,
        "created_at": alert.created_at,
        "updated_at": alert.updated_at,
        "disposition_reason": alert.disposition_reason,
        "version": alert.version,
        "activities": [
            {
                "activity_id": item.activity_id,
                "activity_type": item.activity_type,
                "occurred_at": item.occurred_at,
                "actor": item.actor,
                "reason": item.reason,
                "from_status": item.from_status,
                "to_status": item.to_status,
                "correlation_id": item.correlation_id,
            }
            for item in activities
        ],
    }


def _run_data(session: Session, run: MonitoringRun, idempotent: bool) -> dict[str, object]:
    alerts = session.scalars(
        select(MonitoringAlert)
        .where(MonitoringAlert.run_id == run.run_id)
        .order_by(MonitoringAlert.severity, MonitoringAlert.rule_id, MonitoringAlert.group_key)
    )
    return {
        "run_id": run.run_id,
        "batch_id": run.batch_id,
        "rules_version": run.rules_version,
        "source_hash": run.source_hash,
        "created_at": run.created_at,
        "alert_count": run.alert_count,
        "alert_counts": run.alert_counts,
        "idempotent": idempotent,
        "alerts": [_alert_data(session, alert) for alert in alerts],
    }


def list_rules() -> dict[str, object]:
    return {"rules_version": RULES_VERSION, "rules": list(RULE_CATALOG)}


def run_monitoring(
    session: Session, batch_id: str, actor: str = "system:monitoring"
) -> dict[str, object]:
    payments = list(
        session.scalars(
            select(PaymentInstruction)
            .where(PaymentInstruction.batch_id == batch_id)
            .order_by(PaymentInstruction.payment_id)
        )
    )
    if not payments:
        raise MonitoringNotFound("Payment batch not found or empty.")
    payment_ids = [payment.payment_id for payment in payments]
    events = list(
        session.scalars(
            select(PaymentEvent)
            .where(PaymentEvent.payment_id.in_(payment_ids))
            .order_by(PaymentEvent.occurred_at, PaymentEvent.event_id)
        )
    )
    payment_data = [_payment_record(payment) for payment in payments]
    event_data = [_event_record(event) for event in events]
    source_hash = hashlib.sha256(
        json.dumps(
            {"payments": payment_data, "events": event_data},
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()
    existing = session.scalar(
        select(MonitoringRun).where(
            MonitoringRun.batch_id == batch_id,
            MonitoringRun.rules_version == RULES_VERSION,
            MonitoringRun.source_hash == source_hash,
        )
    )
    if existing:
        return _run_data(session, existing, idempotent=True)

    computed = evaluate_monitoring(
        [
            {**_payment_record(payment), "instructed_at": payment.instructed_at}
            for payment in payments
        ],
        [{**_event_record(event), "occurred_at": event.occurred_at} for event in events],
    )
    run_id = str(uuid4())
    now = datetime.now(UTC)
    alert_counts = dict(sorted(Counter(alert.rule_id for alert in computed).items()))
    run = MonitoringRun(
        run_id=run_id,
        batch_id=batch_id,
        rules_version=RULES_VERSION,
        source_hash=source_hash,
        created_at=now,
        alert_count=len(computed),
        alert_counts=alert_counts,
    )
    session.add(run)
    session.flush()
    for item in computed:
        alert_id = str(uuid4())
        alert = MonitoringAlert(
            alert_id=alert_id,
            run_id=run_id,
            rule_id=item.rule_id,
            group_key=item.group_key,
            title=item.title,
            severity=item.severity,
            status="OPEN",
            explanation=item.explanation,
            threshold=item.threshold,
            false_positive_example=item.false_positive_example,
            evidence=item.evidence,
            created_at=now,
            updated_at=now,
            disposition_reason=None,
            version=1,
        )
        session.add(alert)
        session.flush()
        _write_activity(session, alert_id, "DETECTED", actor, to_status="OPEN")
    session.flush()
    return _run_data(session, run, idempotent=False)


def list_alerts(
    session: Session,
    *,
    alert_status: str | None,
    severity: str | None,
    rule_id: str | None,
    batch_id: str | None = None,
    limit: int,
    offset: int,
) -> dict[str, object]:
    statement = select(MonitoringAlert)
    if batch_id:
        statement = statement.join(
            MonitoringRun, MonitoringAlert.run_id == MonitoringRun.run_id
        ).where(MonitoringRun.batch_id == batch_id)
    if alert_status:
        statement = statement.where(MonitoringAlert.status == alert_status)
    if severity:
        statement = statement.where(MonitoringAlert.severity == severity)
    if rule_id:
        statement = statement.where(MonitoringAlert.rule_id == rule_id)
    alerts = session.scalars(
        statement.order_by(MonitoringAlert.created_at.desc(), MonitoringAlert.alert_id)
        .limit(limit)
        .offset(offset)
    )
    return {
        "alerts": [_alert_data(session, alert) for alert in alerts],
        "limit": limit,
        "offset": offset,
    }


def get_alert(session: Session, alert_id: str) -> dict[str, object]:
    alert = session.get(MonitoringAlert, alert_id)
    if alert is None:
        raise MonitoringNotFound("Monitoring alert not found.")
    return _alert_data(session, alert)


def transition_alert(
    session: Session,
    alert_id: str,
    target_status: str,
    actor: str,
    reason: str | None,
) -> dict[str, object]:
    alert = session.get(MonitoringAlert, alert_id)
    if alert is None:
        raise MonitoringNotFound("Monitoring alert not found.")
    previous = alert.status
    if target_status not in ALERT_TRANSITIONS[previous]:
        raise InvalidAlertAction(f"Transition from {previous} to {target_status} is not allowed.")
    normalized_reason = reason.strip() if reason else None
    if target_status in {"DISMISSED", "ESCALATED"} and not normalized_reason:
        raise InvalidAlertAction("A review reason is required for dismissal or escalation.")
    if target_status == "IN_REVIEW" and not normalized_reason:
        normalized_reason = "Analyst started review."
    now = datetime.now(UTC)
    alert.status = target_status
    alert.updated_at = now
    alert.disposition_reason = normalized_reason
    alert.version += 1
    activity_type = {
        "IN_REVIEW": "REVIEW_STARTED",
        "DISMISSED": "DISMISSED",
        "ESCALATED": "ESCALATED",
    }[target_status]
    _write_activity(
        session,
        alert_id,
        activity_type,
        actor,
        reason=normalized_reason,
        from_status=previous,
        to_status=target_status,
    )
    session.flush()
    return _alert_data(session, alert)


def add_alert_note(session: Session, alert_id: str, actor: str, note: str) -> dict[str, object]:
    alert = session.get(MonitoringAlert, alert_id)
    if alert is None:
        raise MonitoringNotFound("Monitoring alert not found.")
    if alert.status != "IN_REVIEW":
        raise InvalidAlertAction("Start review before adding analyst notes.")
    alert.updated_at = datetime.now(UTC)
    alert.version += 1
    _write_activity(session, alert_id, "NOTE_ADDED", actor, reason=note.strip())
    session.flush()
    return _alert_data(session, alert)


def escalation_summary(session: Session, alert_id: str) -> dict[str, object]:
    alert = session.get(MonitoringAlert, alert_id)
    if alert is None:
        raise MonitoringNotFound("Monitoring alert not found.")
    if alert.status != "ESCALATED":
        raise InvalidAlertAction(
            "Escalate the alert through human review before viewing its summary."
        )
    escalation = session.scalar(
        select(MonitoringActivity)
        .where(
            MonitoringActivity.alert_id == alert_id,
            MonitoringActivity.activity_type == "ESCALATED",
        )
        .order_by(MonitoringActivity.occurred_at.desc(), MonitoringActivity.activity_id.desc())
    )
    return {
        "summary_type": "SIMULATED_INTERNAL_ESCALATION_NOTE",
        "alert_id": alert.alert_id,
        "rule_id": alert.rule_id,
        "rule_title": alert.title,
        "severity": alert.severity,
        "explanation": alert.explanation,
        "threshold": alert.threshold,
        "evidence": alert.evidence,
        "analyst_reason": alert.disposition_reason,
        "analyst": escalation.actor if escalation else None,
        "created_at": escalation.occurred_at if escalation else alert.updated_at,
        "disclaimer": (
            "Fictional training example only. This is not a suspicious activity report, "
            "a regulatory filing, or a determination of fraud or money laundering."
        ),
    }
