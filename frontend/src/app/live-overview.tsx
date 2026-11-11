"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { requestJson } from "../lib/api";
import { activeScenario, getPreparedScenario } from "./scenario-selector";

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/backend";

type Summary = {
  metrics: {
    payment_count: number;
    exact_match_rate_pct: number;
    exception_result_count: number;
    open_case_count: number;
    monitoring_alert_count: number;
  };
};

export default function LiveOverview() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [focus, setFocus] = useState<"all" | "exceptions" | "cases" | "alerts">("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      void refreshKey;
      setLoading(true);
      setError("");
      try {
        const scenario = await getPreparedScenario();
        if (!scenario?.reconciliation_run_id) {
          throw new Error("The selected scenario is being prepared. Try again shortly.");
        }
        const data = await requestJson<Summary>(
          `${API}/api/v1/insights/runs/${encodeURIComponent(scenario.reconciliation_run_id)}`,
        );
        if (active) setSummary(data);
      } catch (cause) {
        if (active) {
          setSummary(null);
          setError(cause instanceof Error ? cause.message : "Unable to load overview.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const refresh = () => {
      void load();
    };
    window.addEventListener("fireops:demo-ready", refresh);
    window.addEventListener("fireops:scenario-changed", refresh);
    window.addEventListener("fireops:operations-updated", refresh);
    return () => {
      active = false;
      window.removeEventListener("fireops:demo-ready", refresh);
      window.removeEventListener("fireops:scenario-changed", refresh);
      window.removeEventListener("fireops:operations-updated", refresh);
    };
  }, [refreshKey]);

  return (
    <section aria-label="Live operational overview" aria-busy={loading} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-800">
            Saved operational evidence
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Selected payment day</h2>
        </div>
        <span className="break-all font-mono text-xs text-slate-500">{activeScenario()}</span>
      </div>
      {loading && (
        <p role="status" className="text-sm text-slate-600">
          Loading the selected scenario’s saved metrics…
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        >
          {error}{" "}
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            className="ml-2 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Overview focus">
        {(["all", "exceptions", "cases", "alerts"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={focus === item}
            onClick={() => setFocus(item)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${focus === item ? "bg-teal-900 text-white" : "border border-slate-300 bg-white text-slate-900"}`}
          >
            {item === "all" ? "All metrics" : item}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Refresh data
        </button>
      </div>
      {summary && !loading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Payments", summary.metrics.payment_count.toLocaleString()],
            ["Exact matches", `${summary.metrics.exact_match_rate_pct.toFixed(1)}%`],
            ["Exceptions", summary.metrics.exception_result_count.toLocaleString()],
            ["Open cases", summary.metrics.open_case_count.toLocaleString()],
            ["Monitoring alerts", summary.metrics.monitoring_alert_count.toLocaleString()],
          ]
            .filter(
              ([label]) =>
                focus === "all" ||
                (focus === "exceptions" && label === "Exceptions") ||
                (focus === "cases" && label === "Open cases") ||
                (focus === "alerts" && label === "Monitoring alerts"),
            )
            .map(([label, value]) => (
              <Link
                key={label}
                href={
                  label === "Payments"
                    ? "/workspace/payments"
                    : label === "Exact matches" || label === "Exceptions"
                      ? "/workspace/reconciliation"
                      : label === "Open cases"
                        ? "/workspace/investigations"
                        : "/workspace/monitoring"
                }
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-700 hover:shadow-md"
              >
                <p className="text-sm text-slate-600">{label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
                <p className="mt-3 text-xs font-semibold text-teal-800">Open details →</p>
              </Link>
            ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <span className="font-semibold text-slate-900">Next action</span>
        <span className="flex-1 text-slate-600">
          {summary?.metrics.exception_result_count
            ? "Review the saved reconciliation differences and open an investigation."
            : "Inspect the payment evidence before reviewing the reconciliation."}
        </span>
        <Link
          href={
            summary?.metrics.exception_result_count
              ? "/workspace/reconciliation"
              : "/workspace/payments"
          }
          className="font-semibold text-teal-800 underline underline-offset-4"
        >
          Continue →
        </Link>
      </div>
    </section>
  );
}
