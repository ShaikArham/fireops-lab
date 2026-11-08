"use client";

import { requestJson } from "../lib/api";

import { useCallback, useEffect, useState } from "react";
import preview from "./phase4-preview.json";
import CaseWorkspace from "./case-workspace";
import { getPreparedScenario } from "./scenario-selector";

type Item = Record<string, string | number> | null;
interface ReconciliationItem {
  result_id?: string;
  classification: string;
  difference_minor: number | null;
  explanation_code: string;
  payment: Item;
  settlement: Item;
}
interface RunResult {
  run_id: string;
  payment_batch_id: string;
  settlement_batch_id: string | null;
  matched_count: number;
  unmatched_count: number;
  exception_count: number;
  result_count: number;
  classification_counts: Record<string, number>;
  results: ReconciliationItem[];
  offset?: number;
  limit?: number;
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/backend";
const sample = preview as {
  title: string;
  rules_version: string;
  payment_instruction_count: number;
  settlement_record_count: number;
  result_count: number;
  classification_counts: Record<string, number>;
  samples: ReconciliationItem[];
};

function money(item: Item): string {
  if (!item) return "No corresponding record";
  const amount = Number(item.amount_minor ?? 0) / 100;
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: String(item.currency ?? "EUR"),
  }).format(amount);
}

function RecordCard({ title, item, dateLabel }: { title: string; item: Item; dateLabel: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {item ? (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-slate-500">ID</dt>
          <dd className="break-all font-mono text-xs">
            {String(item.payment_id ?? item.settlement_id)}
          </dd>
          <dt className="text-slate-500">Reference</dt>
          <dd className="break-all">{String(item.client_reference ?? item.payment_reference)}</dd>
          <dt className="text-slate-500">Amount</dt>
          <dd className="font-semibold">{money(item)}</dd>
          <dt className="text-slate-500">{dateLabel}</dt>
          <dd>{String(item.expected_settlement_date ?? item.settlement_date ?? "—")}</dd>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-slate-500">No corresponding source record</p>
      )}
    </div>
  );
}

function Comparison({ row }: { row: ReconciliationItem }) {
  return (
    <article
      className="rounded-xl border border-slate-200 p-4"
      key={`${row.classification}-${row.payment?.payment_id ?? row.settlement?.settlement_id}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold text-slate-900">{row.classification.replaceAll("_", " ")}</h4>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
          {row.explanation_code.replaceAll("_", " ")}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <RecordCard title="Payment instruction" item={row.payment} dateLabel="Expected date" />
        <RecordCard title="Settlement record" item={row.settlement} dateLabel="Settlement date" />
      </div>
      {row.difference_minor !== null && row.difference_minor !== 0 && (
        <p className="mt-3 text-sm font-medium text-rose-800">
          Difference: {row.difference_minor > 0 ? "+" : ""}
          {row.difference_minor} minor units
        </p>
      )}
    </article>
  );
}

export default function ReconciliationWorkspace() {
  const [paymentBatches, setPaymentBatches] = useState<string[]>([]);
  const [settlementBatches, setSettlementBatches] = useState<string[]>([]);
  const [paymentBatch, setPaymentBatch] = useState("");
  const [settlementBatch, setSettlementBatch] = useState("");
  const [run, setRun] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadBatches = useCallback(() => {
    if (!API) return Promise.resolve();
    setError("");
    return requestJson<{
      batches: Array<{ batch_id: string }>;
      settlement_batches: Array<{ settlement_batch_id: string }>;
    }>(`${API}/api/v1/batches`)
      .then((result) => {
        setPaymentBatches(result.batches.map((batch) => batch.batch_id));
        setSettlementBatches(result.settlement_batches.map((batch) => batch.settlement_batch_id));
        return getPreparedScenario().then(async (selected) => {
          if (!selected) return;
          setPaymentBatch(selected.payment_batch_id);
          setSettlementBatch(selected.settlement_batch_id);
          if (selected.reconciliation_run_id) {
            const prepared = await requestJson<RunResult>(
              `${API}/api/v1/reconciliation/runs/${encodeURIComponent(selected.reconciliation_run_id)}`,
            );
            setRun(prepared);
          } else setRun(null);
        });
      })
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Could not connect to API."),
      );
  }, []);

  useEffect(() => {
    void loadBatches();
    const refreshOnNavigation = () => {
      if (window.location.hash === "#reconciliation") void loadBatches();
    };
    window.addEventListener("hashchange", refreshOnNavigation);
    const changed = () => {
      void loadBatches();
    };
    window.addEventListener("fireops:operations-updated", changed);
    window.addEventListener("fireops:demo-ready", changed);
    window.addEventListener("fireops:scenario-changed", changed);
    return () => {
      window.removeEventListener("hashchange", refreshOnNavigation);
      window.removeEventListener("fireops:operations-updated", changed);
      window.removeEventListener("fireops:demo-ready", changed);
      window.removeEventListener("fireops:scenario-changed", changed);
    };
  }, [loadBatches]);

  const startRun = async () => {
    setBusy(true);
    setError("");
    try {
      const payload = await requestJson<RunResult>(`${API}/api/v1/reconciliation/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_batch_id: paymentBatch,
          settlement_batch_id: settlementBatch || null,
          late_window_days: 3,
        }),
      });

      setRun(payload);
      window.dispatchEvent(new Event("fireops:operations-updated"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reconciliation failed.");
    } finally {
      setBusy(false);
    }
  };

  const loadPage = async (offset: number) => {
    if (!run) return;
    setBusy(true);
    setError("");
    try {
      setRun(
        await requestJson<RunResult>(
          `${API}/api/v1/reconciliation/runs/${encodeURIComponent(run.run_id)}?limit=100&offset=${offset}`,
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load results.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="reconciliation"
      tabIndex={-1}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      aria-labelledby="reconciliation-heading"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">
        Reconciliation
      </p>
      <h2 id="reconciliation-heading" className="mt-2 text-2xl font-semibold text-slate-950">
        Compare every payment with its settlement
      </h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        Each comparison shows the source records side by side. Exact references, integer minor units
        and a three-day date window make every outcome explainable. Ambiguous records stay
        unresolved.
      </p>
      {API && (
        <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="grid gap-2 text-sm font-medium">
            Payment batch
            <select
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"
              disabled={busy}
              value={paymentBatch}
              onChange={(event) => {
                setPaymentBatch(event.target.value);
                setRun(null);
              }}
            >
              <option value="">Select a payment batch</option>
              {paymentBatches.map((batch) => (
                <option key={batch}>{batch}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Settlement batch
            <select
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"
              disabled={busy}
              value={settlementBatch}
              onChange={(event) => {
                setSettlementBatch(event.target.value);
                setRun(null);
              }}
            >
              <option value="">Select a settlement batch</option>
              {settlementBatches.map((batch) => (
                <option key={batch}>{batch}</option>
              ))}
            </select>
          </label>
          <button
            className="min-h-11 rounded-lg bg-slate-900 px-4 font-medium text-white disabled:opacity-50"
            type="button"
            disabled={busy || !paymentBatch || !settlementBatch}
            onClick={startRun}
          >
            {busy ? "Reconciling…" : "Run reconciliation"}
          </button>
        </div>
      )}
      {API && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void loadBatches()}
          className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          Refresh available batches
        </button>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">
          {error}
        </p>
      )}
      {!API && (
        <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-950">
          <strong>Read-only GitHub Pages preview.</strong> This sample was produced by the same
          reconciliation rules from fictional CSV fixtures. The API and database are not hosted on
          GitHub Pages.
        </div>
      )}
      {!run && (
        <p className="mt-4 text-sm font-medium text-teal-900">
          Showing the committed sample fixture, not a new reconciliation run.
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
        <span>{run ? run.result_count : sample.result_count} results</span>
        <span>
          {run
            ? run.matched_count
            : (sample.classification_counts.MATCHED_EXACT ?? 0) +
              (sample.classification_counts.MATCHED_LATE ?? 0)}{" "}
          matched
        </span>
        <span>
          {run
            ? run.unmatched_count
            : (sample.classification_counts.UNMATCHED_INSTRUCTION ?? 0) +
              (sample.classification_counts.UNMATCHED_SETTLEMENT ?? 0)}{" "}
          unmatched source rows
        </span>
        <span>
          {run
            ? run.exception_count
            : sample.result_count -
              sample.classification_counts.MATCHED_EXACT -
              sample.classification_counts.MATCHED_LATE}{" "}
          exceptions
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {(run?.results ?? sample.samples).map((row) => (
          <Comparison
            key={`${row.classification}-${row.payment?.payment_id ?? row.settlement?.settlement_id}`}
            row={row}
          />
        ))}
      </div>
      {run && (
        <p className="mt-4 break-all text-xs text-slate-500">
          Saved run {run.run_id} · batch {run.payment_batch_id} · results {(run.offset ?? 0) + 1}–
          {(run.offset ?? 0) + run.results.length} of {run.result_count}
        </p>
      )}
      {run && (
        <nav className="mt-3 flex flex-wrap gap-3" aria-label="Reconciliation result pages">
          <button
            type="button"
            disabled={busy || (run.offset ?? 0) === 0}
            onClick={() => void loadPage(Math.max(0, (run.offset ?? 0) - 100))}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
          >
            Previous results
          </button>
          <button
            type="button"
            disabled={busy || (run.offset ?? 0) + run.results.length >= run.result_count}
            onClick={() => void loadPage((run.offset ?? 0) + run.results.length)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
          >
            Next results
          </button>
        </nav>
      )}
      <CaseWorkspace results={run?.results ?? sample.samples} />
      {!run && (
        <p className="mt-4 text-xs text-slate-500">
          {sample.title} · rules {sample.rules_version} ·{" "}
          {sample.payment_instruction_count.toLocaleString()} instructions /{" "}
          {sample.settlement_record_count.toLocaleString()} settlement records · synthetic data only
        </p>
      )}
    </section>
  );
}
