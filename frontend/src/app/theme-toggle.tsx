"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("fireops-theme");
    const enabled = stored === "dark";
    document.documentElement.dataset.workspaceTheme = enabled ? "dark" : "light";
    setDark(enabled);
  }, []);
  const toggle = () => {
    const enabled = !dark;
    setDark(enabled);
    document.documentElement.dataset.workspaceTheme = enabled ? "dark" : "light";
    window.localStorage.setItem("fireops-theme", enabled ? "dark" : "light");
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
