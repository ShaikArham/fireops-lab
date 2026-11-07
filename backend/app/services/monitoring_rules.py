from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

RULES_VERSION = "monitoring-1.0"

RULE_CATALOG: tuple[dict[str, str], ...] = (
    {
        "rule_id": "HIGH_VALUE_PAYMENT",
        "title": "Payment above demonstration threshold",
        "severity": "REVIEW",
        "threshold": "amount_minor >= 1,900,000 (19,000 currency units)",
        "purpose": "Surface a large payment amount for a second-person operational review.",
        "false_positive_example": (
            "A scheduled payroll, supplier settlement, or treasury transfer can be high value "
            "and expected."
        ),
    },
    {
        "rule_id": "PAYER_VELOCITY",
        "title": "Multiple instructions in a short window",
        "severity": "PRIORITY",
        "threshold": "at least 5 instructions for one synthetic payer token in 10 minutes",
        "purpose": "Highlight a concentrated burst of instructions for human context review.",
        "false_positive_example": (
            "A legitimate bulk payout or a customer retry after a temporary issue can create "
            "a burst."
        ),
    },
    {
        "rule_id": "REPEATED_FAILURES",
        "title": "Repeated failed payment events",
        "severity": "REVIEW",
        "threshold": "at least 2 failed instructions for one synthetic payer token in 24 hours",
        "purpose": (
            "Help operations review a pattern of failed attempts and identify service issues."
        ),
        "false_positive_example": (
            "A temporary connectivity or validation problem can cause repeated failures "
            "without misconduct."
        ),
    },
    {
        "rule_id": "DUPLICATE_REFERENCE",
        "title": "Repeated client reference",
        "severity": "INFO",
        "threshold": (
            "the same client reference appears on 2 or more distinct instructions in one batch"
        ),
        "purpose": "Highlight possible duplicate processing or an intentionally reused reference.",
        "false_positive_example": (
            "A client may intentionally reuse a reference for split payments or a grouped "
            "instruction."
        ),
    },
)


@dataclass(frozen=True)
class RuleAlert:
    rule_id: str
    group_key: str
    title: str
    severity: str
    explanation: str
    threshold: str
    false_positive_example: str
    evidence: dict[str, Any]


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def evaluate_monitoring(
    payments: list[dict[str, Any]], events: list[dict[str, Any]]
) -> list[RuleAlert]:
    catalog = {rule["rule_id"]: rule for rule in RULE_CATALOG}
    alerts: list[RuleAlert] = []
    by_payment_id = {payment["payment_id"]: payment for payment in payments}

    for payment in payments:
        if payment["amount_minor"] >= 1_900_000:
            rule = catalog["HIGH_VALUE_PAYMENT"]
            alerts.append(
                RuleAlert(
                    rule_id=rule["rule_id"],
                    group_key=payment["payment_id"],
                    title=rule["title"],
                    severity=rule["severity"],
                    explanation=(
                        f"This fictional instruction is {payment['amount_minor']} minor units, "
                        "meeting the configured demonstration threshold. "
                        "Review its business context."
                    ),
                    threshold=rule["threshold"],
                    false_positive_example=rule["false_positive_example"],
                    evidence={
                        "payment_ids": [payment["payment_id"]],
                        "payer_token": payment["payer_account_token"],
                        "amount_minor": payment["amount_minor"],
                        "currency": payment["currency"],
                        "instructed_at": _utc(payment["instructed_at"]).isoformat(),
                    },
                )
            )

    payer_payments: dict[str, list[dict[str, Any]]] = defaultdict(list)
    reference_payments: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for payment in payments:
        payer_payments[payment["payer_account_token"]].append(payment)
        reference_payments[payment["client_reference"]].append(payment)

    for payer_token, group in sorted(payer_payments.items()):
        ordered = sorted(group, key=lambda row: (_utc(row["instructed_at"]), row["payment_id"]))
        left = 0
        best: list[dict[str, Any]] = []
        for right, payment in enumerate(ordered):
            while _utc(payment["instructed_at"]) - _utc(ordered[left]["instructed_at"]) > timedelta(
                minutes=10
            ):
                left += 1
            window = ordered[left : right + 1]
            if len(window) > len(best):
                best = window
        if len(best) >= 5:
            rule = catalog["PAYER_VELOCITY"]
            alerts.append(
                RuleAlert(
                    rule_id=rule["rule_id"],
                    group_key=payer_token,
                    title=rule["title"],
                    severity=rule["severity"],
                    explanation=(
                        f"{len(best)} fictional payment instructions share this payer token "
                        "inside a 10-minute window. Review whether the burst is expected."
                    ),
                    threshold=rule["threshold"],
                    false_positive_example=rule["false_positive_example"],
                    evidence={
                        "payer_token": payer_token,
                        "payment_ids": sorted(row["payment_id"] for row in best),
                        "window_start": _utc(best[0]["instructed_at"]).isoformat(),
                        "window_end": _utc(best[-1]["instructed_at"]).isoformat(),
                        "instruction_count": len(best),
                    },
                )
            )

    failures_by_payer: dict[str, list[tuple[datetime, str]]] = defaultdict(list)
    for event in events:
        if event["event_type"] != "FAILED" or event["payment_id"] not in by_payment_id:
            continue
        payment = by_payment_id[event["payment_id"]]
        failures_by_payer[payment["payer_account_token"]].append(
            (_utc(event["occurred_at"]), event["payment_id"])
        )
    for payer_token, failures in sorted(failures_by_payer.items()):
        ordered = sorted(failures)
        left = 0
        best: list[tuple[datetime, str]] = []
        for right, failure in enumerate(ordered):
            while failure[0] - ordered[left][0] > timedelta(hours=24):
                left += 1
            window = ordered[left : right + 1]
            if len(window) > len(best):
                best = window
        if len(best) >= 2:
            rule = catalog["REPEATED_FAILURES"]
            alerts.append(
                RuleAlert(
                    rule_id=rule["rule_id"],
                    group_key=payer_token,
                    title=rule["title"],
                    severity=rule["severity"],
                    explanation=(
                        f"{len(best)} failed fictional payment events share this payer token "
                        "inside 24 hours. Review failure codes and service context."
                    ),
                    threshold=rule["threshold"],
                    false_positive_example=rule["false_positive_example"],
                    evidence={
                        "payer_token": payer_token,
                        "payment_ids": sorted({payment_id for _, payment_id in best}),
                        "failure_count": len(best),
                        "window_start": best[0][0].isoformat(),
                        "window_end": best[-1][0].isoformat(),
                    },
                )
            )

    for client_reference, group in sorted(reference_payments.items()):
        distinct = sorted({row["payment_id"] for row in group})
        if len(distinct) >= 2:
            rule = catalog["DUPLICATE_REFERENCE"]
            alerts.append(
                RuleAlert(
                    rule_id=rule["rule_id"],
                    group_key=client_reference,
                    title=rule["title"],
                    severity=rule["severity"],
                    explanation=(
                        f"{len(distinct)} distinct fictional payment instructions use this "
                        "client reference. Compare source records before taking action."
                    ),
                    threshold=rule["threshold"],
                    false_positive_example=rule["false_positive_example"],
                    evidence={"client_reference": client_reference, "payment_ids": distinct},
                )
            )

    return sorted(alerts, key=lambda alert: (alert.rule_id, alert.group_key))
