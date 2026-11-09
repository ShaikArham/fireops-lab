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
                ? "The private interactive sessions are full. Explore the read-only six-section project showcase below without a login or backend connection."
                : "The interactive records could not be loaded. Use Retry connection above, or visit About the builder to learn about the project."}
          </p>
          {state === "error" && (
            <div className="mt-5 space-y-4">
              <OfflineShowcase />
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
