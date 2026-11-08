"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

const destinations = [
  { name: "Overview", href: "/workspace/overview", keywords: "dashboard kpi" },
  { name: "Payments", href: "/workspace/payments", keywords: "transaction processing" },
  { name: "Reconciliation", href: "/workspace/reconciliation", keywords: "match exception" },
  { name: "Investigations", href: "/workspace/investigations", keywords: "case evidence" },
  { name: "Monitoring", href: "/workspace/monitoring", keywords: "alert compliance" },
  { name: "Insights", href: "/workspace/insights", keywords: "reports analytics" },
  { name: "About", href: "/workspace/about", keywords: "project application" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const filtered = destinations.filter((item) => (item.name + " " + item.keywords).toLowerCase().includes(query.toLowerCase())).slice(0, 7);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen((previous) => !previous); }
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);
  useEffect(() => { if (open) { setQuery(""); setActive(0); requestAnimationFrame(() => input.current?.focus()); } }, [open]);
  useEffect(() => { if (!open) return; const previous = document.activeElement as HTMLElement | null; const onFocus = (event: KeyboardEvent) => { if (event.key !== "Tab") return; const dialog = document.getElementById("fireops-command-dialog"); const controls = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled])'); if (!controls?.length) return; const first = controls[0], last = controls[controls.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }; document.addEventListener("keydown", onFocus); return () => { document.removeEventListener("keydown", onFocus); previous?.focus(); }; }, [open]);
  const navigate = (href: string) => { setOpen(false); router.push(href); };
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Open workspace navigation search" className="fixed bottom-5 right-5 z-40 flex min-h-11 items-center gap-2 rounded-full border border-slate-600 bg-slate-900 px-4 text-sm font-medium text-white shadow-xl hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"><Search size={17} /><span className="hidden sm:inline">Jump to</span><kbd className="hidden rounded border border-slate-500 px-1.5 text-xs sm:inline">⌘K</kbd></button>
    {open && <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-[12vh]" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div id="fireops-command-dialog" role="dialog" aria-modal="true" aria-label="Jump to FireOPS workspace" className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-600 bg-slate-900 text-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-700 px-4"><Search size={18} className="text-blue-300"/><input ref={input} aria-label="Search workspace destinations" value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => Math.max(0, i - 1)); } if (event.key === "Enter" && filtered[active]) navigate(filtered[active].href); }} placeholder="Search workspaces..." className="h-14 min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-400"/><button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-slate-700"><X size={18}/></button></div>
        <div role="listbox" aria-label="Workspace destinations" className="max-h-[55vh] overflow-y-auto p-2">{filtered.length ? filtered.map((item, index) => <button key={item.href} role="option" aria-selected={index === active} type="button" onMouseEnter={() => setActive(index)} onClick={() => navigate(item.href)} className={`flex min-h-12 w-full items-center justify-between rounded-lg px-4 text-left text-sm ${index === active ? "bg-blue-500/20 text-blue-100" : "text-slate-200 hover:bg-slate-800"}`}><span>{item.name}</span><span className="text-xs text-slate-400">Open</span></button>) : <p className="p-4 text-sm text-slate-300">No matching workspace.</p>}</div>
        <p className="border-t border-slate-700 px-4 py-3 text-xs text-slate-400">↑ ↓ to navigate · Enter to open · Esc to close</p>
      </div>
    </div>}
  </>;
}
