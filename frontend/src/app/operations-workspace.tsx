"use client";

import { requestJson } from "../lib/api";

import { useState } from "react";

type DatasetKind = "payment_instructions" | "settlement_records";

interface ValidationIssue {
  row_number: number | null;
  field: string | null;
  code: string;
  message: string;
}

interface SourcePreview {
  kind: DatasetKind;
  checksum_sha256: string;
  data_row_count: number;
  is_valid: boolean;
  issues_truncated: boolean;
  issues: ValidationIssue[];
  preview: Array<Record<string, string | number>>;
}

interface ControlTotal {
  currency: string;
  direction: string;
  status: string;
  record_count: number;
  total_minor: number;
}

interface Batch {
  batch_id: string;
  control_totals: ControlTotal[];
}

interface SettlementControlTotal {
  currency: string;
  direction: string;
  record_count: number;
  total_minor: number;
}

interface SettlementBatch {
  settlement_batch_id: string;
  control_totals: SettlementControlTotal[];
}

interface PaymentRecord {
  payment_id: string;
  client_reference: string;
  status: string;
  amount_minor: number;
  currency: string;
  direction: string;
}

interface PaymentEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor: string;
  metadata: Record<string, string>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return requestJson<T>(`${API_BASE_URL}/api/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amountMinor / 100);
}

export default function OperationsWorkspace() {
  const [kind, setKind] = useState<DatasetKind>("payment_instructions");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SourcePreview | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [settlementBatches, setSettlementBatches] = useState<SettlementBatch[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refreshBatches = async () => {
    const result = await apiRequest<{
      batches: Batch[];
      settlement_batches: SettlementBatch[];
    }>("/batches");
    setBatches(result.batches);
    setSettlementBatches(result.settlement_batches);
    window.dispatchEvent(new Event("fireops-data-changed"));
  };

  const withFeedback = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request failed.");
    } finally {
      setBusy(false);
    }
  };

  const previewFile = () =>
    withFeedback(async () => {
      if (!file) throw new Error("Choose a CSV file first.");
      setPreview(null);
      const result = await apiRequest<SourcePreview>(`/source-files/preview?kind=${kind}`, {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: file,
      });
      setPreview(result);
      setMessage(
        result.is_valid
          ? `Preview ready. ${result.data_row_count.toLocaleString()} rows passed validation.`
          : "This file has validation issues and cannot be imported.",
      );
    });

  const importFile = () =>
    withFeedback(async () => {
      if (!file || !preview?.is_valid || preview.kind !== kind) {
        throw new Error("Preview a valid file of the selected type before importing.");
      }
      const result = await apiRequest<{
        imported_count: number;
        idempotent: boolean;
        row_count: number;
      }>(`/source-files/import/${kind}?file_name=${encodeURIComponent(file.name)}`, {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: file,
      });
      setMessage(
        result.idempotent
          ? `Already imported. No additional records were added (${result.row_count} source rows).`
          : `Imported ${result.imported_count.toLocaleString()} records atomically.`,
      );
      await refreshBatches();
    });

  const loadBatch = (batch: Batch) =>
    withFeedback(async () => {
      setSelectedBatch(batch.batch_id);
      setPayments([]);
      setSelectedPayment("");
      setEvents([]);
      const result = await apiRequest<{ payments: PaymentRecord[] }>(
        `/batches/${encodeURIComponent(batch.batch_id)}/payments?limit=25`,
      );
      setPayments(result.payments);
      setMessage(
        `Loaded the first ${result.payments.length} payment records from ${batch.batch_id}.`,
      );
    });

  const simulateBatch = (batchId: string) =>
    withFeedback(async () => {
      const result = await apiRequest<{
        processed_count: number;
        settled_count: number;
        failed_count: number;
        idempotent: boolean;
      }>(`/batches/${encodeURIComponent(batchId)}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setMessage(
        result.idempotent
          ? "This batch is already processed. No records or totals changed."
          : `Simulation complete: ${result.settled_count} settled and ${result.failed_count} failed. No money moved.`,
      );
      await refreshBatches();
      const current = await apiRequest<{ payments: PaymentRecord[] }>(
        `/batches/${encodeURIComponent(batchId)}/payments?limit=25`,
      );
      setSelectedBatch(batchId);
      setSelectedPayment("");
      setEvents([]);
      setPayments(current.payments);
    });

  const loadHistory = (paymentId: string) =>
    withFeedback(async () => {
      setSelectedPayment(paymentId);
      setEvents([]);
      const result = await apiRequest<{ events: PaymentEvent[] }>(
        `/payments/${encodeURIComponent(paymentId)}/events`,
      );
      setEvents(result.events);
      setMessage(`Loaded ${result.events.length} events for ${paymentId}.`);
    });

  return (
    <section
      id="operations"
      tabIndex={-1}
      aria-busy={busy}
      aria-labelledby="operations-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
    >
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">
          Payment lifecycle
        </p>
        <h2 id="operations-heading" className="mt-2 text-2xl font-semibold text-slate-950">
          Import, process, and inspect a sample batch
        </h2>
        <p className="mt-3 leading-7 text-slate-600">
          CSVs are validated before import. Repeated files are recognised by checksum. The simulator
          records each state change and never moves money.
        </p>
      </div>

      {!API_BASE_URL && (
        <p className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          This public edition lets you inspect sample evidence without uploading files. Imports and
          payment simulation run in the separate local API environment. Follow the recorded workflow
          below or use the setup guide in About and method.
        </p>
      )}

      {busy && (
        <p role="status" className="mt-4 text-sm text-teal-900">
          Working on this request…
        </p>
      )}
      {API_BASE_URL && (
        <div className="mt-7 grid min-w-0 gap-8">
          <div className="grid min-w-0 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
            <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-800">
              Source type
              <select
                className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3"
                disabled={busy}
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value as DatasetKind);
                  setPreview(null);
                  setMessage("");
                  setError("");
                }}
              >
                <option value="payment_instructions">Payment instructions</option>
                <option value="settlement_records">Settlement records</option>
              </select>
            </label>
            <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-800">
              CSV file
              <input
                className="min-h-11 w-full min-w-0 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                disabled={busy}
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setPreview(null);
                  setMessage("");
                  setError("");
                }}
              />
            </label>
            <button
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={previewFile}
              disabled={busy || !file}
            >
              Preview file
            </button>
            <button
              className="min-h-11 rounded-lg bg-slate-900 px-4 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={importFile}
              disabled={busy || !preview?.is_valid || preview.kind !== kind}
            >
              Import validated file
            </button>
          </div>

          {preview && (
            <div aria-live="polite" className="grid gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Source preview</h3>
              <p className="text-sm text-slate-600">
                {preview.data_row_count.toLocaleString()} data rows · showing up to 5 rows and 6
                columns · SHA-256 <span className="break-all">{preview.checksum_sha256}</span>
              </p>
              {preview.issues_truncated && (
                <p className="text-sm text-amber-900">
                  Only the first validation issues are shown. Correct these and preview the file
                  again.
                </p>
              )}
              {preview.issues.length > 0 && (
                <ul className="list-inside list-disc rounded-lg bg-rose-50 p-4 text-sm text-rose-900">
                  {preview.issues.map((issue) => (
                    <li key={`${issue.row_number}-${issue.field}-${issue.code}-${issue.message}`}>
                      {issue.row_number ? `Row ${issue.row_number}: ` : "File: "}
                      {issue.field ? `${issue.field} · ` : ""}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              )}
              {preview.preview.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        {Object.keys(preview.preview[0])
                          .slice(0, 6)
                          .map((header) => (
                            <th className="whitespace-nowrap px-3 py-2 font-semibold" key={header}>
                              {header.replaceAll("_", " ")}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.slice(0, 5).map((row) => (
                        <tr
                          className="border-t border-slate-200"
                          key={String(row.payment_id ?? row.settlement_id)}
                        >
                          {Object.entries(row)
                            .slice(0, 6)
                            .map(([column, value]) => (
                              <td
                                className="max-w-52 truncate px-3 py-2 text-slate-700"
                                key={column}
                              >
                                {String(value)}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="grid min-w-0 gap-3">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Payment batch controls</h3>
              <button
                className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-800"
                onClick={() => withFeedback(refreshBatches)}
                type="button"
                disabled={busy}
              >
                Refresh batches
              </button>
            </div>
            {batches.length === 0 ? (
              <p className="break-words rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                No payment batches have been imported yet.
              </p>
            ) : (
              batches.map((batch) => (
                <article className="rounded-xl border border-slate-200 p-4" key={batch.batch_id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-semibold text-slate-900">{batch.batch_id}</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium"
                        onClick={() => loadBatch(batch)}
                        type="button"
                        disabled={busy}
                      >
                        Inspect batch
                      </button>
                      <button
                        className="min-h-10 rounded-lg bg-teal-800 px-3 text-sm font-medium text-white"
                        onClick={() => simulateBatch(batch.batch_id)}
                        type="button"
                        disabled={busy}
                      >
                        Simulate processing
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {batch.control_totals.map((total) => (
                      <p
                        className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700"
                        key={`${total.currency}-${total.direction}-${total.status}`}
                      >
                        <span className="font-medium">{total.status}</span> · {total.direction} ·{" "}
                        {total.record_count} records ·{" "}
                        {formatMoney(total.total_minor, total.currency)}
                      </p>
                    ))}
                  </div>
                </article>
              ))
            )}
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Settlement batch controls</h3>
            {settlementBatches.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                No settlement batches have been imported or simulated yet.
              </p>
            ) : (
              settlementBatches.map((batch) => (
                <article
                  className="rounded-xl border border-slate-200 p-4"
                  key={batch.settlement_batch_id}
                >
                  <h4 className="font-semibold text-slate-900">{batch.settlement_batch_id}</h4>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {batch.control_totals.map((total) => (
                      <p
                        className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700"
                        key={`${total.currency}-${total.direction}`}
                      >
                        {total.direction} · {total.record_count} records ·{" "}
                        {formatMoney(total.total_minor, total.currency)}
                      </p>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>

          {selectedBatch && (
            <div className="grid gap-4 rounded-xl border border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Processing history · {selectedBatch}
              </h3>
              {payments.map((payment) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"
                  key={payment.payment_id}
                >
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{payment.payment_id}</span> ·{" "}
                    {payment.client_reference} · {payment.status} ·{" "}
                    {formatMoney(payment.amount_minor, payment.currency)}
                  </p>
                  <button
                    className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium"
                    onClick={() => loadHistory(payment.payment_id)}
                    type="button"
                    disabled={busy}
                  >
                    View event history
                  </button>
                </div>
              ))}
              {selectedPayment && (
                <ol aria-label={`Event history for ${selectedPayment}`} className="grid gap-2">
                  {events.map((event) => (
                    <li className="rounded-lg bg-slate-50 p-3 text-sm" key={event.event_id}>
                      <span className="font-semibold text-slate-900">{event.event_type}</span>
                      <span className="text-slate-600">
                        {` · ${new Date(event.occurred_at).toLocaleString("en-IE")} · ${event.actor}`}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      )}

      <div aria-live="polite" className="mt-5 min-h-6 text-sm">
        {error && <p className="rounded-lg bg-rose-50 p-3 text-rose-900">{error}</p>}
        {message && <p className="rounded-lg bg-teal-50 p-3 text-teal-900">{message}</p>}
        {busy && <p className="text-slate-600">Working…</p>}
      </div>
    </section>
  );
}
