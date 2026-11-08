"use client";
import { useEffect, useState } from "react";
import { requestJson } from "../lib/api";
const API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/backend";

export default function ApiConnectionStatus() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState("Checking your demo workspace…");
  useEffect(() => {
    let active = true;
    requestJson<{ status: string }>(`${API}/api/v1/demo/session`)
      .then(() => {
        if (active) {
          setReady(true);
          setMessage("Your private synthetic workspace is ready. Records persist for 24 hours.");
        }
      })
      .catch(() => {
        if (active)
          setMessage("Load the demo to start your own workspace. Use fictional data only.");
      });
    return () => {
      active = false;
    };
  }, []);
  async function act(reset: boolean) {
    setBusy(true);
    try {
      if (!ready) await requestJson(`${API}/api/v1/demo/session`, { method: "POST" });
      const result = await requestJson<{ message: string }>(
        `${API}/api/v1/demo/${reset ? "reset" : "load"}`,
        { method: "POST" },
      );
      setMessage(result.message);
      setReady(true);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The demo action failed. Please retry.");
    } finally {
      setBusy(false);
      setConfirmReset(false);
    }
  }
  return (
    <section
      aria-label="Your demo workspace"
      className="mb-5 rounded-xl border border-slate-200 bg-white p-4"
    >
      <p role="status" aria-live="polite" className="text-sm text-slate-700">
        {busy ? "Updating your workspace…" : message}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void act(false)}
          className="rounded-lg bg-teal-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Load Demo Data
        </button>
        {ready && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmReset(true)}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm disabled:opacity-50"
          >
            Reset My Demo
          </button>
        )}
      </div>
      {confirmReset && (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm">
            Clear your imported records, cases and notes? This cannot be undone. Other visitors are
            unaffected.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void act(true)}
              className="rounded-lg bg-red-800 px-4 py-3 text-sm text-white"
            >
              Clear my records
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmReset(false)}
              className="px-4 py-3 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
