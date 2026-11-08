from __future__ import annotations

import csv
import io
import json
from datetime import UTC, datetime
from statistics import mean, median

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    CaseActivity,
    ExceptionCase,
    MonitoringAlert,
    MonitoringRun,
    PaymentInstruction,
    ReconciliationResult,
    ReconciliationRun,
    SettlementRecord,
)

MATCHED_CLASSIFICATIONS = {"MATCHED_EXACT", "MATCHED_LATE"}
EXCEPTION_CLASSIFICATIONS = {
    "UNMATCHED_INSTRUCTION",
    "UNMATCHED_SETTLEMENT",
    "AMOUNT_MISMATCH",
    "DUPLICATE_CANDIDATE",
    "AMBIGUOUS_MATCH",
}


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _minutes(start: datetime, end: datetime) -> float:
    return max(0.0, (_utc(end) - _utc(start)).total_seconds() / 60)


def _round(value: float) -> float:
    return round(value, 2)


def build_report(
    session: Session, run_id: str, *, now: datetime | None = None
) -> dict[str, object]:
    run = session.get(ReconciliationRun, run_id)
    if run is None:
        raise LookupError("Reconciliation run not found.")

    generated_at = now or datetime.now(UTC)
    payment_rows = list(
        session.scalars(
            select(PaymentInstruction).where(PaymentInstruction.batch_id == run.payment_batch_id)
        )
    )
    results = list(
        session.scalars(select(ReconciliationResult).where(ReconciliationResult.run_id == run_id))
    )
    categories: dict[str, int] = {}
    exception_value_by_currency: dict[str, int] = {}
    payment_ids: set[str] = set()
    settlement_ids: set[str] = set()
    for result in results:
        categories[result.classification] = categories.get(result.classification, 0) + 1
        if result.classification not in EXCEPTION_CLASSIFICATIONS:
            continue
        if result.payment_id:
            payment_ids.add(result.payment_id)
        if result.settlement_id:
            settlement_ids.add(result.settlement_id)

    for payment_id in payment_ids:
        payment = session.get(PaymentInstruction, payment_id)
        if payment:
            exception_value_by_currency[payment.currency] = (
                exception_value_by_currency.get(payment.currency, 0) + payment.amount_minor
            )
    for settlement_id in settlement_ids:
        settlement = session.get(SettlementRecord, settlement_id)
        if settlement:
            exception_value_by_currency[settlement.currency] = (
                exception_value_by_currency.get(settlement.currency, 0) + settlement.amount_minor
            )

    case_rows = list(
        session.scalars(
            select(ExceptionCase)
            .join(ReconciliationResult, ExceptionCase.result_id == ReconciliationResult.result_id)
            .where(ReconciliationResult.run_id == run_id)
        )
    )
    triage_minutes: list[float] = []
    resolution_minutes: list[float] = []
    root_cause_counts: dict[str, int] = {}
    open_cases = 0
    ageing = {"under_24h": 0, "1_to_3_days": 0, "over_3_days": 0}
    for case in case_rows:
        activities = session.scalars(
            select(CaseActivity)
            .where(CaseActivity.case_id == case.case_id)
            .order_by(CaseActivity.occurred_at, CaseActivity.activity_id)
        )
        for activity in activities:
            if activity.to_value == "IN_REVIEW":
                triage_minutes.append(_minutes(case.created_at, activity.occurred_at))
                break
        if case.resolved_at:
            resolution_minutes.append(_minutes(case.created_at, case.resolved_at))
            if case.root_cause:
                root_cause_counts[case.root_cause] = root_cause_counts.get(case.root_cause, 0) + 1
        else:
            open_cases += 1
            age_hours = _minutes(case.created_at, generated_at) / 60
            if age_hours < 24:
                ageing["under_24h"] += 1
            elif age_hours <= 72:
                ageing["1_to_3_days"] += 1
            else:
                ageing["over_3_days"] += 1

    recent_runs = list(
        session.scalars(
            select(ReconciliationRun)
            .where(ReconciliationRun.finished_at <= run.finished_at)
            .order_by(ReconciliationRun.finished_at.desc(), ReconciliationRun.run_id)
            .limit(20)
        )
    )
    trend: list[dict[str, object]] = []
    seen_inputs: set[tuple[str, tuple[tuple[str, str], ...]]] = set()
    for recent in recent_runs:
        source_signature = tuple(sorted((recent.input_hashes or {}).items()))
        signature = (recent.rules_version, source_signature)
        if signature in seen_inputs:
            continue
        seen_inputs.add(signature)
        counts = recent.classification_counts or {}
        recent_payment_count = (
            session.scalar(
                select(func.count())
                .select_from(PaymentInstruction)
                .where(PaymentInstruction.batch_id == recent.payment_batch_id)
            )
            or 0
        )
        exact = counts.get("MATCHED_EXACT", 0)
        trend.append(
            {
                "run_id": recent.run_id,
                "finished_at": recent.finished_at,
                "payment_batch_id": recent.payment_batch_id,
                "payment_count": recent_payment_count,
                "exact_match_rate_pct": _round(100 * exact / recent_payment_count)
                if recent_payment_count
                else 0,
                "exception_result_count": sum(
                    count
                    for category, count in counts.items()
                    if category in EXCEPTION_CLASSIFICATIONS
                ),
                "exception_categories": {
                    category: count
                    for category, count in counts.items()
                    if category in EXCEPTION_CLASSIFICATIONS
                },
            }
        )
        if len(trend) == 10:
            break

    recurring: dict[str, dict[str, int]] = {}
    for point in trend:
        for category, count in point["exception_categories"].items():
            summary = recurring.setdefault(category, {"runs": 0, "result_rows": 0})
            summary["runs"] += 1
            summary["result_rows"] += count

    monitoring_run = session.scalar(
        select(MonitoringRun)
        .where(MonitoringRun.batch_id == run.payment_batch_id)
        .order_by(MonitoringRun.created_at.desc(), MonitoringRun.run_id)
        .limit(1)
    )
    alert_count = reviewed_alert_count = 0
    if monitoring_run:
        alerts = list(
            session.scalars(
                select(MonitoringAlert).where(MonitoringAlert.run_id == monitoring_run.run_id)
            )
        )
        alert_count = len(alerts)
        reviewed_alert_count = sum(alert.status != "OPEN" for alert in alerts)

    payment_count = len(payment_rows)
    exact_count = categories.get("MATCHED_EXACT", 0)
    return {
        "run_id": run.run_id,
        "payment_batch_id": run.payment_batch_id,
        "settlement_batch_id": run.settlement_batch_id,
        "generated_at": generated_at,
        "metrics": {
            "payment_count": payment_count,
            "settled_payment_count": sum(payment.status == "SETTLED" for payment in payment_rows),
            "matched_exact_count": exact_count,
            "exact_match_rate_pct": _round(100 * exact_count / payment_count)
            if payment_count
            else 0,
            "unmatched_instruction_count": categories.get("UNMATCHED_INSTRUCTION", 0),
            "unmatched_settlement_count": categories.get("UNMATCHED_SETTLEMENT", 0),
            "exception_result_count": sum(
                count
                for category, count in categories.items()
                if category in EXCEPTION_CLASSIFICATIONS
            ),
            "exception_review_value_by_currency_minor": dict(
                sorted(exception_value_by_currency.items())
            ),
            "average_minutes_to_triage": _round(mean(triage_minutes)) if triage_minutes else None,
            "median_minutes_to_resolution": _round(median(resolution_minutes))
            if resolution_minutes
            else None,
            "open_case_count": open_cases,
            "open_case_ageing": ageing,
            "monitoring_alert_count": alert_count,
            "reviewed_alert_count": reviewed_alert_count,
            "alert_review_rate_pct": _round(100 * reviewed_alert_count / alert_count)
            if alert_count
            else None,
        },
        "exception_categories": [
            {"classification": name, "count": categories[name]}
            for name in sorted(categories)
            if name in EXCEPTION_CLASSIFICATIONS
        ],
        "root_cause_distribution": [
            {"root_cause": cause, "resolved_cases": root_cause_counts[cause]}
            for cause in sorted(root_cause_counts)
        ],
        "reconciliation_run_trend": trend,
        "recurring_exception_patterns": [
            {
                "classification": category,
                "distinct_source_runs": recurring[category]["runs"],
                "result_rows_across_runs": recurring[category]["result_rows"],
            }
            for category in sorted(recurring)
        ],
        "definitions": {
            "exact_match_rate_pct": (
                "MATCHED_EXACT results divided by payment instructions in the selected batch."
            ),
            "exception_review_value_by_currency_minor": (
                "Sum of distinct source-side amounts linked to exception results, grouped by "
                "currency; operational review exposure, not loss or confirmed financial impact."
            ),
            "average_minutes_to_triage": (
                "Mean minutes from case creation to the first activity moving the case into "
                "IN_REVIEW; omitted when no case has started review."
            ),
            "median_minutes_to_resolution": (
                "Median minutes from case creation to resolution among resolved cases; omitted "
                "when none are resolved."
            ),
            "open_case_ageing": (
                "Counts of unresolved cases by elapsed time since creation at report generation: "
                "under 24 hours, 1–3 days, and over 3 days."
            ),
            "alert_review_rate_pct": (
                "Alerts not in OPEN status divided by alerts in the latest monitoring run for "
                "this payment batch."
            ),
            "reconciliation_run_trend": (
                "Up to ten recent reconciliation runs at or before the selected run, deduplicated "
                "by input hashes and rules version. This is a run history, not a daily time series."
            ),
            "root_cause_distribution": (
                "Analyst-selected root causes on resolved cases linked to this run. Unresolved "
                "cases are not included, and UNCONFIRMED remains an explicit option."
            ),
        },
        "improvement_exercise": {
            "label": "Hypothetical workload exercise",
            "basis": (
                "The exception result count is a fixture-derived review queue size. Time estimates "
                "use analyst-entered assumptions, not measured productivity or real-world savings."
            ),
            "exception_review_items": sum(
                count
                for category, count in categories.items()
                if category in EXCEPTION_CLASSIFICATIONS
            ),
        },
    }


def report_csv(report: dict[str, object]) -> str:
    metrics = report["metrics"]
    definitions = report["definitions"]
    categories = report["exception_categories"]
    root_causes = report["root_cause_distribution"]
    trend = report["reconciliation_run_trend"]
    recurring = report["recurring_exception_patterns"]
    if not isinstance(metrics, dict) or not isinstance(definitions, dict):
        raise ValueError("Invalid operational report shape.")
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\n")

    def write_row(values: list[object]) -> None:
        cells = []
        for value in values:
            if isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@")):
                value = chr(39) + value
            cells.append(value)
        writer.writerow(cells)

    write_row(["section", "metric", "value", "unit", "definition"])
    units = {
        "exact_match_rate_pct": "percent",
        "average_minutes_to_triage": "minutes",
        "median_minutes_to_resolution": "minutes",
        "alert_review_rate_pct": "percent",
        "exception_review_value_by_currency_minor": "minor currency units grouped by currency",
    }
    for key, value in metrics.items():
        if isinstance(value, dict):
            value = json.dumps(value, sort_keys=True, separators=(",", ":"))
        write_row(
            [
                "metric",
                key,
                "" if value is None else value,
                units.get(key, "count"),
                definitions.get(key, ""),
            ]
        )
    for item in categories:
        write_row(
            [
                "exception_category",
                item["classification"],
                item["count"],
                "count",
                "Results in the selected reconciliation run.",
            ]
        )
    for item in root_causes:
        write_row(
            [
                "root_cause",
                item["root_cause"],
                item["resolved_cases"],
                "resolved cases",
                definitions["root_cause_distribution"],
            ]
        )
    for item in recurring:
        write_row(
            [
                "recurring_pattern",
                item["classification"],
                item["result_rows_across_runs"],
                f"result rows across {item['distinct_source_runs']} distinct input runs",
                definitions["reconciliation_run_trend"],
            ]
        )
    for item in trend:
        write_row(
            [
                "reconciliation_run",
                item["run_id"],
                item["exact_match_rate_pct"],
                f"percent; {item['exception_result_count']} exception results",
                definitions["reconciliation_run_trend"],
            ]
        )
    exercise = report["improvement_exercise"]
    write_row(
        [
            "hypothetical",
            exercise["label"],
            exercise["exception_review_items"],
            "review items",
            exercise["basis"],
        ]
    )
    return output.getvalue()
