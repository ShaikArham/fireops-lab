"use client";

import { demoRequestHeaders, requestJson } from "../lib/api";

import { useEffect, useState } from "react";
import Link from "next/link";
import preview from "./phase4-preview.json";
import { getPreparedScenario } from "./scenario-selector";

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/backend";
const sampleReport = preview as {
  classification_counts: Record<string, number>;
  payment_instruction_count: number;
  settlement_record_count: number;
  result_count: number;
  rules_version: string;
};

interface Report {
  run_id: string;
  payment_batch_id: string;
  settlement_batch_id: string | null;
  generated_at: string;
  metrics: {
    payment_count: number;
    settled_payment_count: number;
    matched_exact_count: number;
    exact_match_rate_pct: number;
    unmatched_instruction_count: number;
    unmatched_settlement_count: number;
    exception_result_count: number;
    exception_review_value_by_currency_minor: Record<string, number>;
    average_minutes_to_triage: number | null;
    median_minutes_to_resolution: number | null;
    open_case_count: number;
    open_case_ageing: { under_24h: number; "1_to_3_days": number; over_3_days: number };
    monitoring_alert_count: number;
    reviewed_alert_count: number;
    alert_review_rate_pct: number | null;
  };
  exception_categories: Array<{ classification: string; count: number }>;
  root_cause_distribution: Array<{ root_cause: string; resolved_cases: number }>;
  reconciliation_run_trend: Array<{
    run_id: string;
    finished_at: string;
    payment_batch_id: string;
    payment_count: number;
    exact_match_rate_pct: number;
    exception_result_count: number;
    exception_categories: Record<string, number>;
  }>;
  recurring_exception_patterns: Array<{
    classification: string;
    distinct_source_runs: number;
    result_rows_across_runs: number;
  }>;
  definitions: Record<string, string>;
  improvement_exercise: {
    label: string;
    basis: string;
    exception_review_items: number;
  };
}

async function fetchReport(): Promise<Report> {
  const scenario = await getPreparedScenario();
  if (!scenario?.reconciliation_run_id)
    throw new Error("The selected scenario has no prepared reconciliation yet.");
  return requestJson<Report>(
    `${API}/api/v1/insights/runs/${encodeURIComponent(scenario.reconciliation_run_id)}`,
  );
}

function minutes(value: number | null): string {
  return value === null ? "Not available yet" : `${value.toLocaleString()} min`;
}

function currencyBreakdown(values: Record<string, number>): string {
  const entries = Object.entries(values);
  if (!entries.length) return "No exposure recorded";
  return entries
    .map(([currency, minor]) =>
      new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(minor / 100),
    )
    .join(" · ");
}

function Metric({
  label,
  value,
  definition,
}: {
  label: string;
  value: string;
  definition: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-medium text-slate-600">{label}</h3>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{definition}</p>
    </article>
  );
}

export default function InsightsWorkspace() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [baselineMinutes, setBaselineMinutes] = useState("");
  const [assistedMinutes, setAssistedMinutes] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [downloadError, setDownloadError] = useState("");
  const [dashboardView, setDashboardView] = useState<"exceptions" | "trends" | "cases">(
    "exceptions",
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!API || refreshKey < 0) return;
    const refresh = () => {
      setLoading(true);
      setError("");
      void fetchReport()
        .then(setReport)
        .catch((cause: unknown) =>
          setError(cause instanceof Error ? cause.message : "Could not load operational insights."),
        )
        .finally(() => setLoading(false));
    };
    refresh();
    const refreshOnNavigation = () => {
      if (window.location.hash === "#insights") refresh();
    };
    window.addEventListener("hashchange", refreshOnNavigation);
    window.addEventListener("fireops:operations-updated", refresh);
    window.addEventListener("fireops:scenario-changed", refresh);
    window.addEventListener("fireops:demo-ready", refresh);
    return () => {
      window.removeEventListener("hashchange", refreshOnNavigation);
      window.removeEventListener("fireops:operations-updated", refresh);
      window.removeEventListener("fireops:scenario-changed", refresh);
      window.removeEventListener("fireops:demo-ready", refresh);
    };
  }, [refreshKey]);

  const downloadRun = async () => {
    setDownloadError("");
    setDownloading(true);
    try {
      const response = await fetch(
        `${API}/api/v1/insights/runs/${encodeURIComponent(report?.run_id ?? "")}/export.csv`,
        { headers: demoRequestHeaders(), signal: AbortSignal.timeout(30_000) },
      );
      if (!response.ok) throw new Error("Could not download this run’s CSV.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `fireops-insights-${report?.run_id ?? "report"}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (cause) {
      setDownloadError(
        cause instanceof Error ? cause.message : "Could not download this run’s CSV.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const baseline = Number(baselineMinutes);
  const assisted = Number(assistedMinutes);
  const exerciseReady =
    report !== null &&
    baselineMinutes !== "" &&
    assistedMinutes !== "" &&
    Number.isFinite(baseline) &&
    Number.isFinite(assisted) &&
    baseline >= 0 &&
    assisted >= 0;
  const hypotheticalDifference = exerciseReady
    ? (baseline - assisted) * report.improvement_exercise.exception_review_items
    : null;

  return (
    <section
      id="insights"
      tabIndex={-1}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      aria-labelledby="insights-heading"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">
        Operational insights
      </p>
      <h2 id="insights-heading" className="mt-2 text-2xl font-semibold text-slate-950">
        Measure the payment day and review workload
      </h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        Metrics are derived from one saved reconciliation run and its linked cases and monitoring
        review. Each value has a stated denominator and boundary. Currency amounts stay grouped by
        currency.
      </p>

      {API && (
        <button
          type="button"
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm"
          disabled={loading}
          onClick={() => setRefreshKey((value) => value + 1)}
        >
          Refresh report
        </button>
      )}
      {API && (
        <p className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-950">
          <strong>Committed fixture baseline:</strong> the read-only sample input contains 1,218
          exact matches from 1,250 payment instructions (<strong>97.44%</strong>). These are sample
          reconciliation counts, not business performance results.
        </p>
      )}

      {!API ? (
        <>
          <p className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-950">
            <strong>Read-only sample report.</strong> These figures are calculated from the
            committed fictional exception-day fixture. Case timings, alert review rates and
            downloadable saved-run reports need the separately configured API and database, which
            are not hosted on this static site.
          </p>
          <a
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white"
            href="data/sample-reconciliation-summary.csv"
            download
          >
            Download sample summary CSV
          </a>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Payment instructions"
              value={sampleReport.payment_instruction_count.toLocaleString()}
              definition="Source rows in the synthetic payment instruction file."
            />
            <Metric
              label="Settlement records"
              value={sampleReport.settlement_record_count.toLocaleString()}
              definition="Source rows in the synthetic settlement file."
            />
            <Metric
              label="Exact matches"
              value={`${(sampleReport.classification_counts.MATCHED_EXACT ?? 0).toLocaleString()} / ${sampleReport.payment_instruction_count.toLocaleString()}`}
              definition="Accepted exact-amount matches, including the documented unique fallback, divided by payment instructions."
            />
            <Metric
              label="Exact match rate"
              value={`${(((sampleReport.classification_counts.MATCHED_EXACT ?? 0) / sampleReport.payment_instruction_count) * 100).toFixed(2)}%`}
              definition="Exact matches ÷ 1,250 payment instructions. Late matches are shown separately."
            />
            <Metric
              label="Exception results"
              value={(
                sampleReport.result_count -
                (sampleReport.classification_counts.MATCHED_EXACT ?? 0) -
                (sampleReport.classification_counts.MATCHED_LATE ?? 0)
              ).toLocaleString()}
              definition="Unmatched rows, duplicate candidates and amount mismatches in the sample run."
            />
            <Metric
              label="Unmatched instructions"
              value={(
                sampleReport.classification_counts.UNMATCHED_INSTRUCTION ?? 0
              ).toLocaleString()}
              definition="Payment-side rows without an accepted settlement match."
            />
            <Metric
              label="Unmatched settlements"
              value={(
                sampleReport.classification_counts.UNMATCHED_SETTLEMENT ?? 0
              ).toLocaleString()}
              definition="Settlement-side rows without an accepted payment match."
            />
            <Metric
              label="Matched late"
              value={(sampleReport.classification_counts.MATCHED_LATE ?? 0).toLocaleString()}
              definition="Matched source records outside the expected settlement date."
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-600">
            Synthetic exception-day preview ·{" "}
            {sampleReport.payment_instruction_count.toLocaleString()} instructions · rules{" "}
            {sampleReport.rules_version}. These are sample reconciliation counts, not business
            performance results.
          </p>
        </>
      ) : loading ? (
        <p role="status" className="mt-5 text-sm text-slate-600">
          Loading the latest saved report…
        </p>
      ) : error ? (
        <p role="alert" className="mt-5 rounded-lg bg-rose-50 p-4 text-sm text-rose-900">
          {error}
        </p>
      ) : report ? (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
            <div className="text-sm">
              <p className="font-semibold text-slate-900">Report source</p>
              <p className="mt-1 text-slate-600">
                Run {report.run_id} · {report.payment_batch_id}
                {report.settlement_batch_id ? ` · ${report.settlement_batch_id}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 font-medium text-white hover:bg-slate-700"
              disabled={downloading}
              onClick={() => void downloadRun()}
            >
              {downloading ? "Preparing CSV…" : "Download this run’s CSV"}
            </button>
          </div>
          {downloadError && (
            <p role="alert" className="mt-3 text-sm text-rose-800">
              {downloadError}
            </p>
          )}

          <section
            aria-label="Interactive insights dashboard"
            className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                  Interactive dashboard
                </p>
                <h3 className="mt-1 text-xl font-semibold">Explore operational performance</h3>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Dashboard view">
                {(["exceptions", "trends", "cases"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    aria-pressed={dashboardView === view}
                    onClick={() => {
                      setDashboardView(view);
                      setSelectedCategory(null);
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${dashboardView === view ? "bg-teal-900 text-white" : "border border-slate-300 bg-white text-slate-900"}`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
            {dashboardView === "exceptions" && (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-slate-600">
                  Select a category to inspect its share of classified exceptions.
                </p>
                {report.exception_categories.length === 0 && <p>No exceptions in this run.</p>}
                {report.exception_categories.map((item) => {
                  const total = report.exception_categories.reduce(
                    (sum, row) => sum + row.count,
                    0,
                  );
                  const percentage = total ? (item.count / total) * 100 : 0;
                  return (
                    <button
                      key={item.classification}
                      type="button"
                      onClick={() => setSelectedCategory(item.classification)}
                      aria-pressed={selectedCategory === item.classification}
                      className={`block w-full rounded-lg border p-3 text-left transition hover:border-teal-600 ${selectedCategory === item.classification ? "border-teal-700 bg-teal-50" : "border-slate-200 bg-white"}`}
                    >
                      <span className="flex justify-between gap-3 text-sm">
                        <span>{item.classification.replaceAll("_", " ")}</span>
                        <strong>
                          {item.count.toLocaleString()} · {percentage.toFixed(1)}%
                        </strong>
                      </span>
                      <span className="mt-2 block h-2 overflow-hidden rounded-full bg-slate-200">
                        <span
                          className="block h-full rounded-full bg-teal-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </span>
                    </button>
                  );
                })}
                {selectedCategory && (
                  <p role="status" className="rounded-lg bg-white p-3 text-sm">
                    Selected: <strong>{selectedCategory.replaceAll("_", " ")}</strong>. Review the
                    individual reconciliation evidence in the{" "}
                    <Link
                      className="font-semibold text-teal-800 underline"
                      href="/workspace/reconciliation"
                    >
                      Reconciliation workspace
                    </Link>
                    .
                  </p>
                )}
              </div>
            )}
            {dashboardView === "trends" && (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-slate-600">
                  Saved reconciliation runs · exact-match percentage
                </p>
                {report.reconciliation_run_trend.length === 0 && <p>No saved trend data yet.</p>}
                {report.reconciliation_run_trend.map((item) => (
                  <div key={item.run_id} className="rounded-lg bg-white p-3">
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <span className="break-all">{item.payment_batch_id}</span>
                      <strong>
                        {item.exact_match_rate_pct.toFixed(1)}% · {item.exception_result_count}{" "}
                        exceptions
                      </strong>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-teal-700"
                        style={{
                          width: `${Math.min(100, Math.max(0, item.exact_match_rate_pct))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {dashboardView === "cases" && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["Under 24 hours", report.metrics.open_case_ageing.under_24h],
                    ["1–3 days", report.metrics.open_case_ageing["1_to_3_days"]],
                    ["Over 3 days", report.metrics.open_case_ageing.over_3_days],
                  ] as const
                ).map(([label, value]) => (
                  <Link
                    key={label}
                    href="/workspace/investigations"
                    className="rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-700"
                  >
                    <p className="text-sm text-slate-600">{label}</p>
                    <p className="mt-2 text-3xl font-bold">{value}</p>
                    <p className="mt-3 text-xs font-semibold text-teal-800">
                      Explore investigations →
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Payment instructions"
              value={report.metrics.payment_count.toLocaleString()}
              definition="Distinct instruction rows in the selected payment batch."
            />
            <Metric
              label="Settled payments"
              value={report.metrics.settled_payment_count.toLocaleString()}
              definition="Instructions currently in SETTLED state in that batch."
            />
            <Metric
              label="Exact match rate"
              value={`${report.metrics.exact_match_rate_pct.toFixed(2)}%`}
              definition={report.definitions.exact_match_rate_pct}
            />
            <Metric
              label="Exception results"
              value={report.metrics.exception_result_count.toLocaleString()}
              definition="Exception classifications in the selected saved reconciliation run."
            />
            <Metric
              label="Unmatched instructions"
              value={report.metrics.unmatched_instruction_count.toLocaleString()}
              definition="Payment-side records without an accepted settlement match."
            />
            <Metric
              label="Unmatched settlements"
              value={report.metrics.unmatched_settlement_count.toLocaleString()}
              definition="Settlement-side records without an accepted payment match."
            />
            <Metric
              label="Exception review exposure"
              value={currencyBreakdown(report.metrics.exception_review_value_by_currency_minor)}
              definition={report.definitions.exception_review_value_by_currency_minor}
            />
            <Metric
              label="Average time to triage"
              value={minutes(report.metrics.average_minutes_to_triage)}
              definition={report.definitions.average_minutes_to_triage}
            />
            <Metric
              label="Median time to resolution"
              value={minutes(report.metrics.median_minutes_to_resolution)}
              definition={report.definitions.median_minutes_to_resolution}
            />
            <Metric
              label="Open investigation cases"
              value={report.metrics.open_case_count.toLocaleString()}
              definition="Cases linked to this run that do not have a resolution timestamp."
            />
            <Metric
              label="Alert review rate"
              value={
                report.metrics.alert_review_rate_pct === null
                  ? "Not available yet"
                  : `${report.metrics.alert_review_rate_pct.toFixed(2)}%`
              }
              definition={report.definitions.alert_review_rate_pct}
            />
            <Metric
              label="Reviewed alerts"
              value={`${report.metrics.reviewed_alert_count} / ${report.metrics.monitoring_alert_count}`}
              definition="Alerts not in OPEN status divided by alerts in the latest monitoring run for this batch."
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section
              className="rounded-xl border border-slate-200 p-4"
              aria-labelledby="categories-heading"
            >
              <h3 id="categories-heading" className="font-semibold text-slate-950">
                Exception categories
              </h3>
              {report.exception_categories.length ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {report.exception_categories.map((item) => (
                    <li
                      key={item.classification}
                      className="flex justify-between gap-4 py-2 text-sm"
                    >
                      <span>{item.classification.replaceAll("_", " ")}</span>
                      <span className="font-semibold tabular-nums">{item.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">No exception results in this run.</p>
              )}
            </section>
            <section
              className="rounded-xl border border-slate-200 p-4"
              aria-labelledby="ageing-heading"
            >
              <h3 id="ageing-heading" className="font-semibold text-slate-950">
                Open case ageing
              </h3>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-slate-600">Under 24 hours</dt>
                  <dd className="font-semibold">{report.metrics.open_case_ageing.under_24h}</dd>
                </div>
                <div>
                  <dt className="text-slate-600">1–3 days</dt>
                  <dd className="font-semibold">
                    {report.metrics.open_case_ageing["1_to_3_days"]}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-600">Over 3 days</dt>
                  <dd className="font-semibold">{report.metrics.open_case_ageing.over_3_days}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-5 text-slate-600">
                {report.definitions.open_case_ageing}
              </p>
            </section>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section
              className="rounded-xl border border-slate-200 p-4"
              aria-labelledby="root-causes-heading"
            >
              <h3 id="root-causes-heading" className="font-semibold text-slate-950">
                Analyst-recorded root causes
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Only resolved cases with an analyst-selected root cause are counted. This is not
                inferred from the exception type.
              </p>
              {report.root_cause_distribution.length ? (
                <ul className="mt-3 divide-y divide-slate-100">
                  {report.root_cause_distribution.map((item) => (
                    <li key={item.root_cause} className="flex justify-between gap-4 py-2 text-sm">
                      <span>{item.root_cause.replaceAll("_", " ")}</span>
                      <span className="font-semibold tabular-nums">{item.resolved_cases}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  No resolved cases have a recorded root cause yet.
                </p>
              )}
            </section>
            <section
              className="rounded-xl border border-slate-200 p-4"
              aria-labelledby="trend-heading"
            >
              <h3 id="trend-heading" className="font-semibold text-slate-950">
                Reconciliation run history
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Distinct source inputs only. Re-running the same input does not create a new trend
                point. This is run history, not a daily time series.
              </p>
              {report.reconciliation_run_trend.length ? (
                <ol className="mt-3 grid gap-2">
                  {report.reconciliation_run_trend.map((item) => (
                    <li
                      key={item.run_id}
                      className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b border-slate-100 pb-2 text-sm"
                    >
                      <span>{item.payment_batch_id}</span>
                      <span className="font-medium tabular-nums">
                        {item.exact_match_rate_pct.toFixed(2)}% exact ·{" "}
                        {item.exception_result_count} exceptions
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  No saved reconciliation history is available.
                </p>
              )}
              {report.recurring_exception_patterns.length > 0 && (
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  Recurring patterns across distinct inputs:{" "}
                  {report.recurring_exception_patterns
                    .map(
                      (item) =>
                        `${item.classification.replaceAll("_", " ")} (${item.distinct_source_runs} runs)`,
                    )
                    .join("; ")}
                  . These are exception classifications, not diagnosed root causes.
                </p>
              )}
            </section>
          </div>

          <section
            className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4"
            aria-labelledby="exercise-heading"
          >
            <h3 id="exercise-heading" className="font-semibold text-amber-950">
              Hypothetical process-improvement exercise
            </h3>
            <p className="mt-2 text-sm leading-6 text-amber-950">
              The exception count is derived from this run. Enter your own illustrative minutes per
              exception for a manual review and a rule-assisted review. This calculator compares
              assumptions only. It does not report measured productivity or actual savings.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium text-slate-800">
                Assumed manual minutes per item
                <input
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"
                  type="number"
                  min="0"
                  step="1"
                  value={baselineMinutes}
                  onChange={(event) => setBaselineMinutes(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-800">
                Assumed assisted minutes per item
                <input
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3"
                  type="number"
                  min="0"
                  step="1"
                  value={assistedMinutes}
                  onChange={(event) => setAssistedMinutes(event.target.value)}
                />
              </label>
            </div>
            {hypotheticalDifference !== null && (
              <p role="status" className="mt-3 text-sm font-medium text-amber-950">
                Assumption-based difference across{" "}
                {report.improvement_exercise.exception_review_items} review items:{" "}
                {hypotheticalDifference.toLocaleString()} minutes. A negative value means the
                assisted assumption takes longer.
              </p>
            )}
          </section>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Generated {new Date(report.generated_at).toLocaleString()}. Review exposure is not loss,
            no currency conversion is applied, and timing metrics describe this fictional dataset
            only.
          </p>
        </>
      ) : null}
    </section>
  );
}
