"use client";

import { requestJson } from "../lib/api";
import { activeScenario } from "./scenario-selector";

import { useEffect, useRef, useState } from "react";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/backend";

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
  const [batches, setBatches] = useState<Batch[]>([]);
  const [settlementBatches, setSettlementBatches] = useState<SettlementBatch[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);

  const requestVersion = useRef(0);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const version = ++requestVersion.current;
      try {
        setBusy(true);
        setError("");
        setPayments([]);
        setSelectedPayment("");
        setEvents([]);
        setOffset(0);
        setTotal(0);
        setSelectedBatch("");
        const result = await apiRequest<{
          batches: Batch[];
          settlement_batches: SettlementBatch[];
        }>("/batches");
        if (!active || version !== requestVersion.current) return;
        setBatches(result.batches);
        setSettlementBatches(result.settlement_batches);
        if (result.batches.length) {
          const first =
            result.batches.find((batch) => batch.batch_id === activeScenario()) ??
            result.batches[0];
          setSelectedBatch(first.batch_id);
          const records = await apiRequest<{ payments: PaymentRecord[]; total: number }>(
            `/batches/${encodeURIComponent(first.batch_id)}/payments?limit=25`,
          );
          if (active && version === requestVersion.current) {
            setPayments(records.payments);
            setTotal(records.total);
          }
        }
      } catch (cause) {
        if (active && version === requestVersion.current)
          setError(cause instanceof Error ? cause.message : "Could not load payment records.");
      } finally {
        if (active && version === requestVersion.current) setBusy(false);
      }
    };
    void refresh();
    window.addEventListener("fireops:operations-updated", refresh);
    window.addEventListener("fireops:demo-ready", refresh);
    window.addEventListener("fireops:scenario-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("fireops:operations-updated", refresh);
      window.removeEventListener("fireops:demo-ready", refresh);
      window.removeEventListener("fireops:scenario-changed", refresh);
    };
  }, []);

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

  const loadBatch = (batch: Batch, nextOffset = 0) =>
    withFeedback(async () => {
      setSelectedBatch(batch.batch_id);
      setOffset(nextOffset);
      setPayments([]);
      setSelectedPayment("");
      setEvents([]);
      const result = await apiRequest<{ payments: PaymentRecord[]; total: number }>(
        `/batches/${encodeURIComponent(batch.batch_id)}/payments?limit=25&offset=${nextOffset}`,
      );
      setPayments(result.payments);
      setTotal(result.total);
      setMessage(
        `Showing ${nextOffset + 1}–${nextOffset + result.payments.length} of ${result.total} payments.`,
      );
    });

  const simulate = () =>
    withFeedback(async () => {
      const result = await apiRequest<{ settled_count: number; failed_count: number }>(
        `/batches/${encodeURIComponent(selectedBatch)}/simulate`,
        { method: "POST", body: JSON.stringify({}) },
      );
      setMessage(
        `Simulation complete: ${result.settled_count} settled and ${result.failed_count} failed. No real money moved.`,
      );
      window.dispatchEvent(new Event("fireops:operations-updated"));
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
          Inspect the preloaded payment records
        </h2>
        <p className="mt-3 leading-7 text-slate-600">
          Explore a preloaded fictional payment batch. Select another batch to inspect its records
          and open any payment to review the event history. No file upload is needed.
        </p>
      </div>

      {!API_BASE_URL && (
        <p className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          The fictional records are prepared automatically.
        </p>
      )}

      {busy && (
        <p role="status" className="mt-4 text-sm text-teal-900">
          Working on this request…
        </p>
      )}
      {API_BASE_URL && (
        <div className="mt-7 grid min-w-0 gap-8">
          <div className="grid min-w-0 gap-3">
            <label htmlFor="fireops-batch" className="text-sm font-semibold text-slate-800">
              Choose a fictional payment batch
            </label>
            <select
              id="fireops-batch"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm sm:max-w-lg"
              value={selectedBatch}
              disabled={busy || batches.length === 0}
              onChange={(event) => {
                const batch = batches.find((item) => item.batch_id === event.target.value);
                if (batch) {
                  window.localStorage.setItem("fireops-active-scenario", batch.batch_id);
                  window.dispatchEvent(new Event("fireops:scenario-changed"));
                }
              }}
            >
              {batches.length === 0 && <option value="">Preparing payment records…</option>}
              {batches.map((batch) => (
                <option key={batch.batch_id} value={batch.batch_id}>
                  {batch.batch_id}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !selectedBatch}
                onClick={() => void simulate()}
                className="rounded-lg bg-teal-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Simulate processing
              </button>
              <span className="self-center text-xs text-slate-500">
                Synthetic lifecycle only. Repeat runs do not duplicate settlements.
              </span>
            </div>
            {batches
              .find((batch) => batch.batch_id === selectedBatch)
              ?.control_totals.map((total) => (
                <p
                  key={`${total.currency}-${total.direction}-${total.status}`}
                  className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700"
                >
                  <strong>{total.status}</strong> · {total.direction} · {total.record_count} records
                  · {formatMoney(total.total_minor, total.currency)}
                </p>
              ))}
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
              <nav aria-label="Payment record pages" className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busy || offset === 0}
                  onClick={() => {
                    const batch = batches.find((b) => b.batch_id === selectedBatch);
                    if (batch) void loadBatch(batch, Math.max(0, offset - 25));
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
                >
                  Previous payments
                </button>
                <span className="text-sm">
                  {total ? offset + 1 : 0}–{offset + payments.length} of {total}
                </span>
                <button
                  type="button"
                  disabled={busy || offset + payments.length >= total}
                  onClick={() => {
                    const batch = batches.find((b) => b.batch_id === selectedBatch);
                    if (batch) void loadBatch(batch, offset + 25);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
                >
                  Next payments
                </button>
              </nav>
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
