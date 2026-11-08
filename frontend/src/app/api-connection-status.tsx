"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "connected" | "unavailable" | "unconfigured";

export default function ApiConnectionStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const api = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

  useEffect(() => {
    if (!api) {
      setStatus("unconfigured");
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    fetch(`${api}/health`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("API health check failed");
        const data = (await response.json()) as { status?: string };
        setStatus(data.status === "ok" ? "connected" : "unavailable");
      })
      .catch(() => setStatus("unavailable"))
      .finally(() => clearTimeout(timeout));
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [api]);

  const labels: Record<Status, string> = {
    checking: "Checking operations API…",
    connected: "Operations API online · write access not confirmed",
    unavailable: "Operations API unavailable · sample views only",
    unconfigured: "Operations API not connected · sample views only",
  };
  return (
    <div role="status" aria-live="polite" className="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${status === "connected" ? "bg-emerald-600" : status === "checking" ? "bg-amber-500" : "bg-slate-400"}`} />
      {labels[status]}
    </div>
  );
}
