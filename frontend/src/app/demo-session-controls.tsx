"use client";

import { useState } from "react";
import { requestJson } from "../lib/api";

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/backend";

export default function DemoSessionControls() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(action: "session" | "load" | "reset") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await requestJson<{ message?: string; status: string }>(
        `${API}/api/v1/demo/${action}`,
        { method: "POST" },
      );
      setMessage(result.message ?? "Your private demo workspace is ready.");
      window.dispatchEvent(new Event("fireops:operations-updated"));
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The demo action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Demo workspace controls" className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">Your isolated demo workspace</p>
      <p className="mt-1 text-xs text-slate-600">Start a private fictional-data session, load sample records, then process and investigate them. Reset clears only this session.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => run("session")} className="rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Start demo</button>
        <button type="button" disabled={busy} onClick={() => run("load")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50">Load sample data</button>
        <button type="button" disabled={busy} onClick={() => run("reset")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50">Reset my demo</button>
      </div>
      {message && <p role="status" className="mt-2 text-sm text-teal-800">{message}</p>}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </section>
  );
}
