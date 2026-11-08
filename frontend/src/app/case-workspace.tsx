"use client";

import { useCallback, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const EXCEPTIONS = new Set([
  "UNMATCHED_INSTRUCTION",
  "UNMATCHED_SETTLEMENT",
  "AMOUNT_MISMATCH",
  "DUPLICATE_CANDIDATE",
  "AMBIGUOUS_MATCH",
]);

interface ResultOption {
  result_id?: string;
  classification: string;
  payment?: Record<string, string | number> | null;
  settlement?: Record<string, string | number> | null;
}

interface Activity {
  activity_id: string;
  activity_type: string;
  occurred_at: string;
  actor: string;
  reason: string | null;
  from_value: string | null;
  to_value: string | null;
  root_cause?: string | null;
}

interface CaseRecord {
  case_id: string;
  result_id: string;
  run_id: string;
  classification: string;
  status: "OPEN" | "IN_REVIEW" | "ESCALATED" | "RESOLVED";
  priority: string;
  assigned_to: string | null;
  root_cause: string | null;
  activities?: Activity[];
  payment: Record<string, string | number> | null;
  settlement: Record<string, string | number> | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}/api/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json()) as T & { detail?: string };
  if (!response.ok) throw new Error(body.detail ?? "Case action failed.");
  return body;
}

export default function CaseWorkspace({ results }: { results: ResultOption[] }) {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selected, setSelected] = useState<CaseRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [assignee, setAssignee] = useState("");
  const [note, setNote] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [resolutionRootCause, setResolutionRootCause] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadCases = useCallback(async () => {
    if (!API) return;
    const query = new URLSearchParams();
    if (statusFilter) query.set("status", statusFilter);
    if (assignedFilter) query.set("assigned_to", assignedFilter);
    const payload = await request<{ cases: CaseRecord[] }>(`/cases?${query.toString()}`);
    setCases(payload.cases);
  }, [statusFilter, assignedFilter]);

  useEffect(() => {
    void loadCases().catch((cause: unknown) =>
      setError(cause instanceof Error ? cause.message : "Could not load cases."),
    );
  }, [loadCases]);

  const act = async (operation: () => Promise<CaseRecord>) => {
    setBusy(true);
    setError("");
    try {
      const updated = await operation();
      setSelected(updated);
      await loadCases();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Case action failed.");
    } finally {
      setBusy(false);
    }
  };

  const openCase = (result: ResultOption) => {
    if (!result.result_id) return;
    void act(async () => {
      const created = await request<CaseRecord>("/cases", {
        method: "POST",
        body: JSON.stringify({ result_id: result.result_id, priority: "NORMAL" }),
      });
      return created;
    });
  };

  if (!API) {
    const example = results.find((item) => item.classification === "UNMATCHED_INSTRUCTION");
    const payment = example?.payment;
    const amountMinor = Number(payment?.amount_minor ?? 0);
    const currency = String(payment?.currency ?? "GBP");
    const amount = new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
    }).format(amountMinor / 100);

    if (!example || !payment) return null;

    return (
      <section
        id="investigation"
        className="mt-8 rounded-2xl border border-teal-200 bg-teal-50/60 p-5 sm:p-8"
        aria-labelledby="case-preview-heading"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-900">
          Phase 5 · investigation walkthrough
        </p>
        <h2 id="case-preview-heading" className="mt-2 text-2xl font-semibold text-slate-950">
          Take one unmatched payment to its next evidence check
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-700">
          This read-only example uses a synthetic source row. It is a guided scenario, not a saved
          case or a claim that the payment failed.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-950">Evidence in the sample batch</h3>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-600">Payment ID</dt>
              <dd className="break-all font-mono">{String(payment.payment_id ?? "—")}</dd>
              <dt className="text-slate-600">Client reference</dt>
              <dd className="break-all">{String(payment.client_reference ?? "—")}</dd>
              <dt className="text-slate-600">Instruction amount</dt>
              <dd className="font-semibold">{amount}</dd>
              <dt className="text-slate-600">Expected settlement</dt>
              <dd>{String(payment.expected_settlement_date ?? "—")}</dd>
              <dt className="text-slate-600">Settlement row</dt>
              <dd>No corresponding row in this sample</dd>
            </dl>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-950">What I would investigate next</h3>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-6 text-slate-700">
              <li>Confirm the settlement file is complete for the expected date and scheme.</li>
              <li>Check the processing event history and any available scheme trace reference.</li>
              <li>Request settlement-operations confirmation and record the evidence received.</li>
            </ol>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              <strong>Current conclusion:</strong> unresolved from the supplied records. Missing
              evidence is not proof of a failed payment or a loss.
            </p>
          </article>
        </div>
      </section>
    );
  }
  const hasOpen = new Set(cases.map((item) => item.result_id));

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      aria-labelledby="case-heading"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">
        Phase 5 · investigations
      </p>
      <h2 id="case-heading" className="mt-2 text-2xl font-semibold text-slate-950">
        Exception cases and audit history
      </h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        Open a case from a reconciliation exception, assign an analyst, record evidence, and move it
        through controlled review. Every action is retained in the case history.
      </p>
      {results.length > 0 && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold">Current run exceptions</h3>
          <ul className="mt-2 grid gap-2">
            {results
              .filter((item) => EXCEPTIONS.has(item.classification))
              .map((item) => (
                <li
                  key={item.result_id ?? item.classification}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm"
                >
                  <span>
                    {item.classification.replaceAll("_", " ")} ·{" "}
                    {String(
                      item.payment?.payment_id ?? item.settlement?.settlement_id ?? "source record",
                    )}
                  </span>
                  {item.result_id && (
                    <button
                      type="button"
                      className="min-h-10 rounded-lg border border-slate-300 px-3 font-medium disabled:opacity-50"
                      disabled={busy || hasOpen.has(item.result_id)}
                      onClick={() => openCase(item)}
                    >
                      {hasOpen.has(item.result_id)
                        ? "Case already open"
                        : "Open investigation case"}
                    </button>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Filter status
              <select
                aria-label="Filter cases by status"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option>OPEN</option>
                <option>IN_REVIEW</option>
                <option>ESCALATED</option>
                <option>RESOLVED</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Filter owner
              <input
                aria-label="Filter cases by owner"
                className="min-h-11 rounded-lg border border-slate-300 px-3"
                value={assignedFilter}
                onChange={(event) => setAssignedFilter(event.target.value)}
                placeholder="Analyst name"
              />
            </label>
          </div>
          <ul aria-label="Exception case queue" className="mt-3 grid gap-2">
            {cases.map((item) => (
              <li key={item.case_id}>
                <button
                  type="button"
                  className={`min-h-14 w-full rounded-lg border p-3 text-left ${selected?.case_id === item.case_id ? "border-teal-700 bg-teal-50" : "border-slate-200 bg-white"}`}
                  onClick={() =>
                    void request<CaseRecord>(`/cases/${item.case_id}`)
                      .then(setSelected)
                      .catch((cause: unknown) =>
                        setError(cause instanceof Error ? cause.message : "Could not load case."),
                      )
                  }
                >
                  <span className="block font-semibold">
                    {item.classification.replaceAll("_", " ")}
                  </span>
                  <span className="text-xs text-slate-600">
                    {item.status} · {item.assigned_to ?? "Unassigned"} · {item.case_id.slice(0, 8)}
                  </span>
                </button>
              </li>
            ))}
            {cases.length === 0 && (
              <li className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                No cases match these filters.
              </li>
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Case investigation</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {selected.classification.replaceAll("_", " ")} · {selected.status} · priority{" "}
                    {selected.priority}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                  {selected.case_id.slice(0, 8)}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <label className="grid gap-1 text-sm">
                  Assign to analyst
                  <input
                    className="min-h-11 rounded-lg border border-slate-300 px-3"
                    value={assignee}
                    onChange={(event) => setAssignee(event.target.value)}
                    placeholder="e.g. analyst.one"
                  />
                </label>
                <button
                  type="button"
                  className="min-h-11 self-end rounded-lg border border-slate-300 px-3 font-medium disabled:opacity-50"
                  disabled={busy || selected.status === "RESOLVED" || !assignee.trim()}
                  onClick={() =>
                    void act(() =>
                      request(`/cases/${selected.case_id}/assignment`, {
                        method: "POST",
                        body: JSON.stringify({ assigned_to: assignee }),
                      }),
                    )
                  }
                >
                  Assign
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <label className="grid gap-1 text-sm">
                  Investigation note
                  <textarea
                    className="min-h-20 rounded-lg border border-slate-300 p-3"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Record what the source evidence shows"
                  />
                </label>
                <button
                  type="button"
                  className="min-h-11 self-end rounded-lg bg-slate-900 px-3 font-medium text-white disabled:opacity-50"
                  disabled={busy || selected.status === "RESOLVED" || !note.trim()}
                  onClick={() =>
                    void act(() =>
                      request<CaseRecord>(`/cases/${selected.case_id}/notes`, {
                        method: "POST",
                        body: JSON.stringify({ note }),
                      }).then((result) => {
                        setNote("");
                        return result;
                      }),
                    )
                  }
                >
                  Add note
                </button>
              </div>
              <label className="mt-3 grid gap-1 text-sm">
                Action reason
                <textarea
                  className="min-h-16 rounded-lg border border-slate-300 p-3"
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  placeholder="Required to escalate, resolve, or reopen"
                />
              </label>
              {selected.status !== "RESOLVED" && (
                <label className="mt-3 grid gap-1 text-sm">
                  Resolution root cause
                  <select
                    aria-label="Resolution root cause"
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"
                    value={resolutionRootCause}
                    onChange={(event) => setResolutionRootCause(event.target.value)}
                  >
                    <option value="">Select only when resolving</option>
                    <option value="SETTLEMENT_DELAY">Settlement delay</option>
                    <option value="SOURCE_DATA_QUALITY">Source data quality</option>
                    <option value="DUPLICATE_INSTRUCTION">Duplicate instruction</option>
                    <option value="PROCESSING_FAILURE">Processing failure</option>
                    <option value="INCOMPLETE_BATCH">Incomplete batch</option>
                    <option value="OTHER">Other</option>
                    <option value="UNCONFIRMED">Unconfirmed after review</option>
                  </select>
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
                        request(`/cases/${selected.case_id}/transitions`, {
                          method: "POST",
                          body: JSON.stringify({ target_status: "IN_REVIEW" }),
                        }),
                      )
                    }
                  >
                    Start review
                  </button>
                )}
                {selected.status !== "RESOLVED" && selected.status !== "ESCALATED" && (
                  <button
                    type="button"
                    className="min-h-10 rounded-lg border border-amber-300 px-3 text-sm text-amber-900 disabled:opacity-50"
                    disabled={busy || !actionReason.trim()}
                    onClick={() =>
                      void act(() =>
                        request(`/cases/${selected.case_id}/transitions`, {
                          method: "POST",
                          body: JSON.stringify({
                            target_status: "ESCALATED",
                            reason: actionReason,
                          }),
                        }),
                      )
                    }
                  >
                    Escalate
                  </button>
                )}
                {selected.status !== "RESOLVED" && (
                  <button
                    type="button"
                    className="min-h-10 rounded-lg border border-emerald-300 px-3 text-sm text-emerald-900 disabled:opacity-50"
                    disabled={busy || !actionReason.trim() || !resolutionRootCause}
                    onClick={() =>
                      void act(() =>
                        request(`/cases/${selected.case_id}/transitions`, {
                          method: "POST",
                          body: JSON.stringify({
                            target_status: "RESOLVED",
                            reason: actionReason,
                            root_cause: resolutionRootCause,
                          }),
                        }),
                      )
                    }
                  >
                    Resolve case
                  </button>
                )}
                {selected.status === "RESOLVED" && (
                  <button
                    type="button"
                    className="min-h-10 rounded-lg border border-rose-300 px-3 text-sm text-rose-900 disabled:opacity-50"
                    disabled={busy || !actionReason.trim()}
                    onClick={() =>
                      void act(() =>
                        request(`/cases/${selected.case_id}/transitions`, {
                          method: "POST",
                          body: JSON.stringify({ target_status: "OPEN", reason: actionReason }),
                        }),
                      )
                    }
                  >
                    Reopen with reason
                  </button>
                )}
              </div>
              <h4 className="mt-5 font-semibold">Audit history</h4>
              <ol
                aria-label="Case audit history"
                className="mt-2 grid gap-2 border-l border-slate-200 pl-3"
              >
                {(selected.activities ?? []).map((activity) => (
                  <li key={activity.activity_id} className="text-sm">
                    <span className="font-medium">
                      {activity.activity_type.replaceAll("_", " ")}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      {activity.actor} · {new Date(activity.occurred_at).toLocaleString()}
                    </span>
                    {activity.reason && (
                      <p className="mt-1 break-words text-slate-600">{activity.reason}</p>
                    )}
                    {activity.from_value && (
                      <p className="text-xs text-slate-500">
                        {activity.from_value} → {activity.to_value}
                      </p>
                    )}
                    {activity.root_cause && (
                      <p className="text-xs font-medium text-teal-800">
                        Root cause: {activity.root_cause.replaceAll("_", " ")}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Select a case from the queue to review evidence and activity.
            </p>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">
          {error}
        </p>
      )}
    </section>
  );
}
