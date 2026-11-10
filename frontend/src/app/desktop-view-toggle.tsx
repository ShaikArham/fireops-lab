"use client";

import { useEffect, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";

const STORAGE_KEY = "fireops-workspace-layout";

export default function DesktopViewToggle() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    try {
      const enabled = sessionStorage.getItem(STORAGE_KEY) === "desktop";
      document.documentElement.dataset.workspaceLayout = enabled ? "desktop" : "responsive";
      setDesktop(enabled);
    } catch {
      document.documentElement.dataset.workspaceLayout = "responsive";
    }
    return () => {
      delete document.documentElement.dataset.workspaceLayout;
    };
  }, []);

  function toggle() {
    const next = !desktop;
    document.documentElement.dataset.workspaceLayout = next ? "desktop" : "responsive";
    try {
      sessionStorage.setItem(STORAGE_KEY, next ? "desktop" : "responsive");
    } catch {
      // Storage can be unavailable in private browsing.
    }
    setDesktop(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={desktop}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
    >
      {desktop ? <Smartphone size={17} aria-hidden="true" /> : <Monitor size={17} aria-hidden="true" />}
      {desktop ? "Mobile view" : "Desktop view"}
    </button>
  );
}
