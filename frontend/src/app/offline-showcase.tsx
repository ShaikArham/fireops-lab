"use client";

import { useState } from "react";

const sections = [
  "Overview",
  "Payments",
  "Reconciliation",
  "Investigations",
  "Monitoring",
  "Insights",
] as const;
type Section = (typeof sections)[number];
const counts = [
  ["Payment instructions", "1,250"],
  ["Settlement records", "1,230"],
  ["Exact matches", "1,218"],
  ["Reconciliation results", "1,260"],
] as const;
const classifications = [
  ["Exact matches", 1218],
  ["Duplicate candidates", 20],
  ["Unmatched instructions", 10],
  ["Unmatched settlements", 10],
  ["Amount mismatches", 1],
  ["Late matches", 1],
] as const;

export default function OfflineShowcase({
  initialSection = "Overview",
}: {
  initialSection?: Section;
}) {
  const [section, setSection] = useState<Section>(initialSection);
  return (
    <section
      className="rounded-xl border border-teal-200 bg-teal-50 p-5 text-slate-950"
      aria-label="Offline project showcase"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
        Always available · Read-only · Synthetic project dataset
      </p>
      <h3 className="mt-2 text-xl font-semibold">Explore the payment operations workflow</h3>
      <p className="mt-2 text-sm text-slate-700">
        This offline showcase uses the repository’s fictional_exception_day reconciliation summary.
        It is not connected to the private demo API. No records are changed.
      </p>
      <nav aria-label="Offline showcase sections" className="mt-5 flex flex-wrap gap-2">
        {sections.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={section === item}
            onClick={() => setSection(item)}
            className={
              section === item
                ? "rounded-lg bg-teal-900 px-3 py-2 text-sm font-semibold text-white"
                : "rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-teal-950"
            }
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="mt-5 rounded-xl border border-teal-100 bg-white p-5">
        <h4 className="text-lg font-semibold">{section}</h4>
        {section === "Overview" && (
          <>
            <p className="mt-2 text-sm text-slate-600">
              A fixed snapshot of the payment and settlement reconciliation scenario.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {counts.map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-600">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </>
        )}
        {section === "Payments" && (
          <>
            <p className="mt-2 text-sm text-slate-600">
              The synthetic scenario contains 1,250 payment instructions. The interactive
              application supports batch inspection, payment simulation and event history when a
              private session is available.
            </p>
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
              Source snapshot: <strong>fictional_exception_day</strong> · 1,250 instructions · 1,230
              settlement records.
            </p>
          </>
        )}
        {section === "Reconciliation" && (
          <>
            <p className="mt-2 text-sm text-slate-600">
              The deterministic reconciliation rules classify matches and exceptions without
              processing real payments.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Result classification</th>
                    <th className="py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {classifications.map(([name, count]) => (
                    <tr className="border-b" key={name}>
                      <td className="py-2">{name}</td>
                      <td className="py-2 text-right tabular-nums">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {section === "Investigations" && (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Investigation workflows connect reconciliation exceptions to evidence, notes and case
              handling in the interactive application.
            </p>
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
              Exception categories in the committed scenario: 20 duplicate candidates, 10 unmatched
              instructions, 10 unmatched settlements and 1 amount mismatch. These are aggregate
              counts, not invented individual cases.
            </p>
          </>
        )}
        {section === "Monitoring" && (
          <>
            <p className="mt-2 text-sm text-slate-600">
              The application includes monitoring and escalation workflows. This static showcase
              does not display live alerts or pretend that alerts have been reviewed.
            </p>
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
              Review the 42 non-exact reconciliation results in the sample classification table,
              including late matches and exception candidates. This is a derived sample count, not
              an AML alert total.
            </p>
          </>
        )}
        {section === "Insights" && (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Summary measures derived from the committed synthetic CSV.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-600">Exact matches / results</p>
                <p className="text-2xl font-bold">96.67%</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-600">Non-exact classifications</p>
                <p className="text-2xl font-bold">42</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Percentage = 1,218 / 1,260. The denominator is reconciliation results, not unique
              payment instructions.
            </p>
          </>
        )}
      </div>
      <a
        className="mt-4 inline-block text-sm font-semibold text-teal-900 underline"
        href="../../data/sample-reconciliation-summary.csv"
        download
      >
        Download source reconciliation CSV
      </a>
      <p className="mt-2 text-xs text-slate-600">
        Source: frontend/public/data/sample-reconciliation-summary.csv · rules_version
        reconciliation-v1 · All records fictional.
      </p>
    </section>
  );
}
