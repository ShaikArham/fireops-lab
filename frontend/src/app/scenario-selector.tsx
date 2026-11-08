"use client";

import { useEffect, useState } from "react";

export const SCENARIO_KEY = "fireops-active-scenario";
export const SCENARIOS = [
  { id: "BATCH-E-20261015", label: "Settlement exception day" },
  { id: "BATCH-N-20261014", label: "Normal operations day" },
] as const;

export function activeScenario(): string {
  if (typeof window === "undefined") return SCENARIOS[0].id;
  const stored = window.localStorage.getItem(SCENARIO_KEY);
  return SCENARIOS.some((item) => item.id === stored)
    ? (stored ?? SCENARIOS[0].id)
    : SCENARIOS[0].id;
}

export default function ScenarioSelector() {
  const [selected, setSelected] = useState(SCENARIOS[0].id as string);
  useEffect(() => {
    const sync = () => setSelected(activeScenario());
    sync();
    window.addEventListener("fireops:scenario-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("fireops:scenario-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <label htmlFor="fireops-scenario" className="text-sm font-semibold text-slate-800">
        Guided scenario
      </label>
      <select
        id="fireops-scenario"
        value={selected}
        onChange={(event) => {
          const value = event.target.value;
          window.localStorage.setItem(SCENARIO_KEY, value);
          setSelected(value);
          window.dispatchEvent(new Event("fireops:scenario-changed"));
        }}
        className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:max-w-sm"
      >
        {SCENARIOS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <span className="text-xs text-slate-500">
        Fictional data · selection persists between sections
      </span>
    </div>
  );
}

export interface PreparedScenario {
  payment_batch_id: string;
  settlement_batch_id: string;
  reconciliation_run_id: string | null;
}

export async function getPreparedScenario(): Promise<PreparedScenario | null> {
  const { requestJson } = await import("../lib/api");
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/backend";
  const response = await requestJson<{ scenarios: PreparedScenario[] }>(
    `${base}/api/v1/demo/scenarios`,
  );
  return response.scenarios.find((item) => item.payment_batch_id === activeScenario()) ?? null;
}
