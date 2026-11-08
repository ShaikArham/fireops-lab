"use client";

import { useCallback, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const RULES = [
  {
    rule_id: "HIGH_VALUE_PAYMENT",
    title: "Payment above demonstration threshold",
    severity: "REVIEW",
    threshold: "amount_minor >= 1,900,000 (19,000 currency units)",
    purpose: "Surface a large payment amount for a second-person operational review.",
    false_positive_example:
      "A scheduled payroll, supplier settlement, or treasury transfer can be high value and expected.",
  },
  {
    rule_id: "PAYER_VELOCITY",
    title: "Multiple instructions in a short window",
    severity: "PRIORITY",
    threshold: "at least 5 instructions for one synthetic payer token in 10 minutes",
    purpose: "Highlight a concentrated burst of instructions for human context review.",
    false_positive_example:
      "A legitimate bulk payout or a customer retry after a temporary issue can create a burst.",
  },
  {
    rule_id: "REPEATED_FAILURES",
    title: "Repeated failed payment events",
    severity: "REVIEW",
    threshold: "at least 2 failed instructions for one synthetic payer token in 24 hours",
    purpose: "Help operations review a pattern of failed attempts and identify service issues.",
    false_positive_example:
      "A temporary connectivity or validation problem can cause repeated failures without misconduct.",
  },
  {
    rule_id: "DUPLICATE_REFERENCE",
    title: "Repeated client reference",
    severity: "INFO",
    threshold: "same client reference on 2 or more distinct instructions in one batch",
    purpose: "Highlight possible duplicate processing or an intentionally reused reference.",
    false_positive_example:
      "A client may intentionally reuse a reference for split payments or a grouped instruction.",
  },
];

interface Activity {
  activity_id: string;
  activity_type: string;
  occurred_at: string;
  actor: string;
  reason: string | null;
  from_status: string | null;
  to_status: string | null;
}
interface MonitoringRule {
  rule_id: string;
  title: string;
  severity: string;
  threshold: string;
  purpose: string;
  false_positive_example: string;
}
interface Alert {
  alert_id: string;
  run_id: string;
  rule_id: string;
  group_key: string;
  title: string;
  severity: "INFO" | "REVIEW" | "PRIORITY";
  status: "OPEN" | "IN_REVIEW" | "DISMISSED" | "ESCALATED";
  explanation: string;
  threshold: string;
  false_positive_example: string;
  evidence: Record<string, string | number | string[]>;
  activities: Activity[];
}
interface EscalationSummary {
  summary_type: string;
  rule_title: string;
  severity: string;
  explanation: string;
  threshold: string;
  evidence: Record<string, string | number | string[]>;
  analyst_reason: string | null;
  analyst: string | null;
  created_at: string;
  disclaimer: string;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}/api/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload = (await response.json()) as T & { detail?: string };
  if (!response.ok) throw new Error(payload.detail ?? "Monitoring request failed.");
  return payload;
}

function pretty(value: string): string {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
}

export default function MonitoringWorkspace() {
  const [batches, setBatches] = useState<string[]>([]);
  const [rules, setRules] = useState<MonitoringRule[]>(RULES);
  const [batchId, setBatchId] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [summary, setSummary] = useState<EscalationSummary | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadAlerts = useCallback(async () => {
    if (!API) return;
    const query = new URLSearchParams();
    if (statusFilter) query.set("status", statusFilter);
    if (severityFilter) query.set("severity", severityFilter);
    const result = await apiRequest<{ alerts: Alert[] }>(`/monitoring/alerts?${query.toString()}`);
    setAlerts(result.alerts);
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    if (!API) return;
    const refresh = () => {
      void Promise.all([
        apiRequest<{ batches: Array<{ batch_id: string }> }>("/batches"),
        apiRequest<{ rules: MonitoringRule[] }>("/monitoring/rules"),
        loadAlerts(),
      ])
        .then(([batchResult, ruleResult]) => {
          setBatches(batchResult.batches.map((batch) => batch.batch_id));
          setRules(ruleResult.rules);
        })
        .catch((cause: unknown) =>
          setError(cause instanceof Error ? cause.message : "Could not load monitoring data."),
        );
    };
    refresh();
    const refreshOnNavigation = () => {
      if (window.location.hash === "#monitoring") refresh();
    };
    window.addEventListener("hashchange", refreshOnNavigation);
    return () => window.removeEventListener("hashchange", refreshOnNavigation);
  }, [loadAlerts]);

  const act = async (operation: () => Promise<Alert>) => {
    if (!selected) return;
    setBusy(true);
    setError("");
    setMessage("");
    setSummary(null);
    try {
      const updated = await operation();
      setSelected(updated);
      await loadAlerts();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Monitoring action failed.");
    } finally {
      setBusy(false);
    }
  };

  const runMonitoring = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    setSelected(null);
    setSummary(null);
    try {
      const result = await apiRequest<{
        alerts: Alert[];
        alert_count: number;
        idempotent: boolean;
      }>("/monitoring/runs", { method: "POST", body: JSON.stringify({ batch_id: batchId }) });
      setAlerts(result.alerts);
      setMessage(
        `${result.alert_count} rule alert${result.alert_count === 1 ? "" : "s"} created. ${result.idempotent ? "This unchanged source batch was already reviewed by the rules." : "Each alert requires human review."}`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Monitoring run failed.");
    } finally {
      setBusy(false);
    }
  };

  const viewSummary = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<EscalationSummary>(
        `/monitoring/alerts/${selected.alert_id}/escalation-summary`,
      );
      setSummary(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load escalation summary.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="monitoring"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      aria-labelledby="monitoring-heading"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">
        Phase 6 · monitoring and human review
      </p>
      <h2 id="monitoring-heading" className="mt-2 text-2xl font-semibold text-slate-950">
        Review explainable operational alerts
      </h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        Four deterministic rules surface fictional payment patterns with their thresholds, source
        evidence, and a possible benign explanation. An alert is a prompt for review, never a
        finding of fraud or money laundering.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rules.map((rule) => (
          <article
            key={rule.rule_id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900">{rule.title}</h3>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-700">
                {rule.severity}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{rule.purpose}</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              <strong>Threshold:</strong> {rule.threshold}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              <strong>Possible false positive:</strong> {rule.false_positive_example}
            </p>
          </article>
        ))}
      </div>

      {!API ? (
        <p className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-950">
          <strong>Read-only Pages preview.</strong> Rule definitions are shown here. Running alerts
          and recording analyst decisions require the separately configured API and database.
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-2 text-sm font-medium">
              Synthetic payment batch
              <select
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"
                value={batchId}
                onChange={(event) => setBatchId(event.target.value)}
              >
                <option value="">Select a payment batch</option>
                {batches.map((batch) => (
                  <option key={batch}>{batch}</option>
                ))}
              </select>
            </label>
            <button
              className="min-h-11 rounded-lg bg-slate-900 px-4 font-medium text-white disabled:opacity-50"
              type="button"
              disabled={busy || !batchId}
              onClick={() => void runMonitoring()}
            >
              {busy ? "Checking rules…" : "Run monitoring rules"}
            </button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium">
                  Filter by status
                  <select
                    aria-label="Filter alerts by status"
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option>OPEN</option>
                    <option>IN_REVIEW</option>
                    <option>DISMISSED</option>
                    <option>ESCALATED</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Filter by severity
                  <select
                    aria-label="Filter alerts by severity"
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"
                    value={severityFilter}
                    onChange={(event) => setSeverityFilter(event.target.value)}
                  >
                    <option value="">All severities</option>
                    <option>INFO</option>
                    <option>REVIEW</option>
                    <option>PRIORITY</option>
                  </select>
                </label>
              </div>
              <ul aria-label="Monitoring alert queue" className="mt-3 grid gap-2">
                {alerts.map((alert) => (
                  <li key={alert.alert_id}>
                    <button
                      type="button"
                      className={`min-h-16 w-full rounded-lg border p-3 text-left ${selected?.alert_id === alert.alert_id ? "border-teal-700 bg-teal-50" : "border-slate-200 bg-white"}`}
                      onClick={() => {
                        setSummary(null);
                        void apiRequest<Alert>(`/monitoring/alerts/${alert.alert_id}`)
                          .then(setSelected)
                          .catch((cause: unknown) =>
                            setError(
                              cause instanceof Error ? cause.message : "Could not load alert.",
                            ),
                          );
                      }}
                    >
                      <span className="block font-semibold">{alert.title}</span>
                      <span className="text-xs text-slate-600">
                        {alert.severity} · {alert.status} · {alert.group_key}
                      </span>
                    </button>
                  </li>
                ))}
                {alerts.length === 0 && (
                  <li className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                    No alerts match this filter. A clean result does not certify that a batch is
                    risk free.
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{selected.title}</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        {selected.rule_id} · {selected.severity} · {selected.status}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                      {selected.alert_id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{selected.explanation}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    <strong>Rule threshold:</strong> {selected.threshold}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    <strong>Possible false positive:</strong> {selected.false_positive_example}
                  </p>
                  <h4 className="mt-4 font-semibold">Evidence</h4>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                    {Object.entries(selected.evidence).map(([key, value]) => (
                      <div key={key} className="contents">
                        <dt className="font-medium text-slate-600">{pretty(key)}</dt>
                        <dd className="break-all text-slate-800">
                          {Array.isArray(value) ? value.join(", ") : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {selected.status === "IN_REVIEW" && (
                    <>
                      <label className="mt-4 grid gap-1 text-sm">
                        Analyst note
                        <textarea
                          className="min-h-20 rounded-lg border border-slate-300 p-3"
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder="Record the evidence or benign explanation reviewed"
                        />
                      </label>
                      <button
                        type="button"
                        className="mt-2 min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium disabled:opacity-50"
                        disabled={busy || !note.trim()}
                        onClick={() =>
                          void act(() =>
                            apiRequest<Alert>(`/monitoring/alerts/${selected.alert_id}/notes`, {
                              method: "POST",
                              body: JSON.stringify({ note }),
                            }).then((updated) => {
                              setNote("");
                              return updated;
                            }),
                          )
                        }
                      >
                        Add note
                      </button>
                    </>
                  )}

                  {selected.status === "IN_REVIEW" && (
                    <label className="mt-4 grid gap-1 text-sm">
                      Review reason
                      <textarea
                        className="min-h-16 rounded-lg border border-slate-300 p-3"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Required to dismiss or escalate"
                      />
                    </label>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.status === "OPEN" && (
                      <button
                        type="button"
                        className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm"
                        disabled={busy}
                        onClick={() =>
                          void act(() =>
                            apiRequest<Alert>(
                              `/monitoring/alerts/${selected.alert_id}/transitions`,
                              {
                                method: "POST",
                                body: JSON.stringify({ target_status: "IN_REVIEW" }),
                              },
                            ),
                          )
                        }
                      >
                        Start review
                      </button>
                    )}
                    {selected.status === "IN_REVIEW" && (
                      <>
                        <button
                          type="button"
                          className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm disabled:opacity-50"
                          disabled={busy || !reason.trim()}
                          onClick={() =>
                            void act(() =>
                              apiRequest<Alert>(
                                `/monitoring/alerts/${selected.alert_id}/transitions`,
                                {
                                  method: "POST",
                                  body: JSON.stringify({ target_status: "DISMISSED", reason }),
                                },
                              ),
                            )
                          }
                        >
                          Dismiss with reason
                        </button>
                        <button
                          type="button"
                          className="min-h-10 rounded-lg border border-amber-300 px-3 text-sm text-amber-900 disabled:opacity-50"
                          disabled={busy || !reason.trim()}
                          onClick={() =>
                            void act(() =>
                              apiRequest<Alert>(
                                `/monitoring/alerts/${selected.alert_id}/transitions`,
                                {
                                  method: "POST",
                                  body: JSON.stringify({ target_status: "ESCALATED", reason }),
                                },
                              ),
                            )
                          }
                        >
                          Escalate for review
                        </button>
                      </>
                    )}
                    {selected.status === "ESCALATED" && (
                      <button
                        type="button"
                        className="min-h-10 rounded-lg border border-teal-700 px-3 text-sm font-medium text-teal-900 disabled:opacity-50"
                        disabled={busy}
                        onClick={() => void viewSummary()}
                      >
                        View simulated escalation summary
                      </button>
                    )}
                  </div>

                  {summary && (
                    <article
                      className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4"
                      aria-label="Simulated escalation summary"
                    >
                      <h4 className="font-semibold">Simulated internal escalation note</h4>
                      <p className="mt-2 text-sm">
                        {summary.rule_title} · {summary.severity}
                      </p>
                      <p className="mt-1 text-sm leading-6">{summary.explanation}</p>
                      <p className="mt-2 text-sm">
                        <strong>Analyst reason:</strong> {summary.analyst_reason}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Prepared by {summary.analyst ?? "demo analyst"} ·{" "}
                        {new Date(summary.created_at).toLocaleString()}
                      </p>
                      <p className="mt-3 border-t border-amber-300 pt-3 text-xs leading-5">
                        {summary.disclaimer}
                      </p>
                    </article>
                  )}

                  <h4 className="mt-5 font-semibold">Review history</h4>
                  <ol
                    aria-label="Alert review history"
                    className="mt-2 grid gap-2 border-l border-slate-200 pl-3"
                  >
                    {selected.activities.map((activity) => (
                      <li key={activity.activity_id} className="text-sm">
                        <span className="font-medium">{pretty(activity.activity_type)}</span>
                        <span className="ml-2 text-xs text-slate-500">
                          {activity.actor} · {new Date(activity.occurred_at).toLocaleString()}
                        </span>
                        {activity.reason && (
                          <p className="mt-1 break-words text-slate-600">{activity.reason}</p>
                        )}
                        {activity.from_status && (
                          <p className="text-xs text-slate-500">
                            {activity.from_status} → {activity.to_status}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  Select an alert to review its evidence and history.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {message && (
        <p role="status" className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-950">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">
          {error}
        </p>
      )}
      <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
        Training simulation only. Alerts are rule-generated prompts for human review. They do not
        establish suspected or proven misconduct, satisfy an AML obligation, or file a suspicious
        activity report.
      </p>
    </section>
  );
}
