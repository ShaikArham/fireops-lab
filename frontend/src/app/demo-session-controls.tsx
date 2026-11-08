"use client";

import { useEffect, useState } from "react";
import { requestJson } from "../lib/api";

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\\/$/, "") ?? "/backend";
const KEY = "fireops-demo-autoload-attempt";

export default function DemoSessionControls() {
  const [state, setState] = useState<"checking" | "loading" | "ready" | "error">("checking");
  const [message, setMessage] = useState("Preparing your fictional payment workspace…");

  useEffect(() => {
    let cancelled = false;
    async function initialise() {
      try {
        // Existing visitor records are never overwritten by automatic loading.
        await requestJson(`${API}/api/v1/demo/session`);
        sessionStorage.removeItem(KEY);
        if (!cancelled) { setState("ready"); setMessage("Your private demo records are ready."); window.dispatchEvent(new Event("fireops:demo-ready")); }
      } catch (error) {
        const isMissing = error instanceof Error && /Start your demo workspace|expired|401/.test(error.message);
        if (!isMissing) {
          if (!cancelled) { setState("error"); setMessage(error instanceof Error ? error.message : "Unable to connect to demo data."); }
          return;
        }
        // One automatic seed attempt per browser tab prevents write loops on failures.
        if (sessionStorage.getItem(KEY) === "attempted") {
          if (!cancelled) { setState("error"); setMessage("Demo data could not be prepared. Refresh to retry."); }
          return;
        }
        sessionStorage.setItem(KEY, "attempted");
        if (!cancelled) setState("loading");
        try {
          await requestJson(`${API}/api/v1/demo/session`, { method: "POST" });
          await requestJson(`${API}/api/v1/demo/load`, { method: "POST" });
          sessionStorage.removeItem(KEY);
          if (!cancelled) {
            setState("ready");
            setMessage("Fictional payment records loaded automatically.");
            window.dispatchEvent(new Event("fireops:operations-updated"));
            window.dispatchEvent(new Event("fireops:demo-ready"));
            window.location.reload();
          }
        } catch (cause) {
          if (!cancelled) {
            setState("error");
            setMessage(cause instanceof Error ? cause.message : "Unable to prepare demo data.");
          }
        }
      }
    }
    void initialise();
    return () => { cancelled = true; };
  }, []);

  if (state === "ready") return null;

  return (
    <div role="status" aria-live="polite" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
      <span className={state === "error" ? "text-red-700" : "text-slate-700"}>{message}</span>

    </div>
  );
}
