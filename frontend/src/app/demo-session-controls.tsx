"use client";
import { type ReactNode, useEffect, useState } from "react";
import { prepareDemo, resetDemo } from "../lib/demo-session";
import OfflineShowcase from "./offline-showcase";

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
  const [showLiveStatus, setShowLiveStatus] = useState(false);
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
      {state === "ready" && (
        <section
          aria-label="Your demo workspace"
          className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              role="status"
              aria-live="polite"
              className="text-slate-600"
            >
              {message}
            </p>
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
      )}
      {state === "ready" ? (
        children
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Explore FireOPS Lab · available without a connection
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Review fictional payment processing, reconciliation, exception handling, monitoring
              and insights. This read-only project tour works even when private demo sessions are
              full.
            </p>
            <div className="mt-4">
              <OfflineShowcase />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                className="inline-flex rounded-lg bg-teal-900 px-4 py-3 text-sm font-semibold text-white"
                href="../about/"
              >
                About the project and CV
              </a>
              <button
                type="button"
                onClick={() => setShowLiveStatus((value) => !value)}
                className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900"
                aria-expanded={showLiveStatus}
              >
                {showLiveStatus ? "Hide live demo status" : "Try interactive demo"}
              </button>
            </div>
            {showLiveStatus && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p role="status" className="text-sm text-slate-800">
                  {state === "loading"
                    ? "Connecting to the optional private demo…"
                    : atCapacity
                      ? "Private demo sessions are currently full. The showcase above remains available."
                      : message}
                </p>
                {state === "error" && (
                  <button
                    type="button"
                    className="mt-3 rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => setAttempt((n) => n + 1)}
                  >
                    Retry private connection
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
            <video
              className="aspect-video w-full"
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
        </div>
      )}
    </>
  );
}
