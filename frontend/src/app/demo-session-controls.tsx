"use client";
import { type ReactNode, useEffect, useState } from "react";
import { prepareDemo, resetDemo } from "../lib/demo-session";

export default function DemoSessionControls({
  children,
  enabled = true,
}: {
  children?: ReactNode;
  enabled?: boolean;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("Preparing your fictional payment workspace…");
  const [attempt, setAttempt] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const atCapacity = state === "error" && /at capacity/i.test(message);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setState("loading");
    void prepareDemo(attempt > 0)
      .then(() => {
        if (active) {
          setState("ready");
          setMessage("Your private demo records are ready.");
        }
      })
      .catch((error) => {
        if (active) {
          setState("error");
          setMessage(error instanceof Error ? error.message : "Unable to prepare demo data.");
        }
      });
    return () => {
      active = false;
    };
  }, [attempt, enabled]);
  async function reset() {
    setConfirmReset(false);
    setState("loading");
    setMessage("Resetting only your fictional workspace…");
    try {
      await resetDemo();
      setState("ready");
      setMessage("Your demo has been reset.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Reset failed. Please retry.");
    }
  }
  if (!enabled) return <>{children}</>;
  return (
    <>
      <section
        aria-label="Your demo workspace"
        className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            role="status"
            aria-live="polite"
            className={state === "error" ? "text-red-800" : "text-slate-600"}
          >
            {message}
          </p>
          {state === "error" && (
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="rounded-lg bg-teal-800 px-4 py-3 font-semibold text-white"
            >
              Retry connection
            </button>
          )}
          {state === "ready" && (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
            >
              Reset My Demo
            </button>
          )}
        </div>
        {state === "loading" && (
          <p className="mt-2 text-xs text-slate-500">
            The free demo service may take a minute to wake up. Your actions never move real money.
          </p>
        )}
        {confirmReset && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <p>
              Replace your cases, notes and records with the original fictional scenarios? Other
              visitors are unaffected.
            </p>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => void reset()}
                className="rounded-lg bg-red-800 px-4 py-3 text-white"
              >
                Reset my records
              </button>
              <button type="button" onClick={() => setConfirmReset(false)} className="px-4 py-3">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
      {state === "ready" ? (
        children
      ) : (
        <div
          className="rounded-xl border border-slate-200 bg-white p-6"
          aria-busy={state === "loading"}
        >
          <h2 className="text-lg font-semibold text-slate-900">
            {state === "loading"
              ? "Connecting to the demo"
              : atCapacity
                ? "All interactive demo workspaces are currently in use"
                : "Demo connection unavailable"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {state === "loading"
              ? "Preparing your private fictional payment records. You can still browse the other sections using the sidebar while the service starts."
              : atCapacity
                ? "The private interactive sessions are full. The read-only reconciliation sample below is available immediately without a login or backend connection."
                : "The interactive records could not be loaded. Use Retry connection above, or visit About the builder to learn about the project."}
          </p>
          {state === "error" && (
            <div className="mt-5 space-y-4">
              <section
                aria-label="Read-only sample reconciliation"
                className="rounded-xl border border-teal-200 bg-teal-50 p-5 text-slate-900"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
                  Offline sample · fictional_exception_day · reconciliation-v1
                </p>
                <h3 className="mt-2 text-xl font-semibold">Payment reconciliation evidence</h3>
                <p className="mt-2 text-sm text-slate-700">
                  These figures come from the committed synthetic reconciliation summary CSV. They
                  are a fixed project sample, not live session data.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ["Payment instructions", "1,250"],
                      ["Settlement records", "1,230"],
                      ["Exact matches", "1,218"],
                      ["Reconciliation results", "1,260"],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-teal-100 bg-white p-4">
                      <p className="text-xs text-slate-600">{label}</p>
                      <p className="mt-1 text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                <h4 className="mt-5 font-semibold">Exception breakdown</h4>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-teal-200">
                        <th className="py-2">Classification</th>
                        <th className="py-2 text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        [
                          ["Duplicate candidates", 20],
                          ["Unmatched instructions", 10],
                          ["Unmatched settlements", 10],
                          ["Amount mismatches", 1],
                          ["Late matches", 1],
                        ] as const
                      ).map(([label, count]) => (
                        <tr className="border-b border-teal-100" key={label}>
                          <td className="py-2">{label}</td>
                          <td className="py-2 text-right tabular-nums">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-slate-600">
                  Source: data/sample-reconciliation-summary.csv · Fictional data only · Interactive
                  investigation requires an available private session.
                </p>
                <a
                  className="mt-3 inline-block text-sm font-semibold text-teal-900 underline"
                  href="../../data/sample-reconciliation-summary.csv"
                  download
                >
                  Download sample reconciliation CSV
                </a>
              </section>
              <a
                className="inline-flex rounded-lg bg-teal-900 px-4 py-3 text-sm font-semibold text-white"
                href="../about/"
              >
                Explore the project and CV
              </a>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <video
                  className="aspect-video w-full bg-slate-950"
                  src="../../videos/fireops-introduction.mp4"
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="Recorded FireOPS Lab introduction film"
                >
                  <track
                    kind="captions"
                    src="../../videos/fireops-captions.vtt"
                    srcLang="en"
                    label="English captions"
                    default
                  />
                  Your browser does not support HTML video.
                </video>
              </div>
              <p className="text-xs text-slate-500">
                Recorded walkthrough only. The interactive demo requires an available session.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
