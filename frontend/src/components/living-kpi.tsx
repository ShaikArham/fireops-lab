"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type LivingKpiProps = {
  label: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  updatedAt?: string;
  lowerIsBetter?: boolean;
};

export function LivingKpi({ label, value, previousValue, suffix = "", prefix = "", decimals = 0, updatedAt, lowerIsBetter = false }: LivingKpiProps) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (!Number.isFinite(value)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || from === value) { setDisplay(value); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 500);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * ease);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const delta = previousValue === undefined ? null : value - previousValue;
  const positive = delta !== null && (lowerIsBetter ? delta < 0 : delta > 0);
  const negative = delta !== null && (lowerIsBetter ? delta > 0 : delta < 0);
  const formatted = Number.isFinite(display) ? display.toLocaleString("en-IE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : "—";
  return <section aria-label={label} className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-50 shadow-sm transition-colors hover:border-slate-500">
    <p className="text-sm font-medium text-slate-300">{label}</p>
    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums" aria-label={`${prefix}${value.toLocaleString("en-IE", { maximumFractionDigits: decimals })}${suffix}`}>{prefix}{formatted}{suffix}</p>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      {delta !== null && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium ${positive ? "bg-emerald-900/50 text-emerald-200" : negative ? "bg-amber-900/50 text-amber-200" : "bg-slate-700 text-slate-200"}`}>{delta > 0 ? <ArrowUpRight size={14}/> : delta < 0 ? <ArrowDownRight size={14}/> : <Minus size={14}/>} {delta > 0 ? "+" : ""}{delta.toLocaleString("en-IE", { maximumFractionDigits: decimals })}{suffix} vs previous</span>}
      {updatedAt && <time className="text-slate-400">{updatedAt}</time>}
    </div>
  </section>;
}
