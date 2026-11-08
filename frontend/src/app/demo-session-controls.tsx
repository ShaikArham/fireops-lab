"use client";

import { useState } from "react";
import { requestJson } from "../lib/api";

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/backend";
type Action = "session" | "load" | "reset";

export default function DemoSessionControls() {
  const [busy, setBusy] = useState<Action | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function post(action: Action) {
    return requestJson<{ message?: string; status: string }>(`${API}/api/v1/demo/${action}`, {
      method: "POST",
    });
  }

  async function run(action: Action) {
    if (busy) return;
    if (action === "reset" && !window.confirm("Clear all records in your own temporary demo workspace? This cannot be undone.")) return;
    setBusy(action);
    setError("");
    setMessage("");
    try {
      if (action !== "session") {
        try {
          await requestJson(`${API}/api/v1/demo/session`);
        } catch (cause) {
          if (!(cause instanceof Error) || !cause.message.includes("Start your demo workspace")) throw cause;
          await post("session");
        }
      }
      const result = await post(action);
      setMessage(result.message ?? (action === "session" ? "Your private demo workspace is ready." : "Demo updated."));
      window.dispatchEvent(new Event("fireops:operations-updated"));
      if (action !== "session") {
        window.setTimeout(() => window.location.reload(), 1200);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The demo action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-label="Demo workspace controls" className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">Your isolated demo workspace</p>
      <p className="mt-1 text-xs text-slate-600">All records are fictional and private to this browser session. Load sample data to begin, or reset only your own records.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy !== null} onClick={() => run("session")} className="min-h-11 rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy === "session" ? "Starting…" : "Start demo"}</button>
        <button type="button" disabled={busy !== null} onClick={() => run("load")} className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">{busy === "load" ? "Loading…" : "Load sample data"}</button>
        <button type="button" disabled={busy !== null} onClick={() => run("reset")} className="min-h-11 rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-800 disabled:opacity-50">{busy === "reset" ? "Resetting…" : "Reset my demo"}</button>
      </div>
      <div aria-live="polite" aria-atomic="true">
        {message && <p role="status" className="mt-2 text-sm text-teal-800">{message}</p>}
        {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    </section>
  );
}
