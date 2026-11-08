"use client";

import Link from "next/link";
import { CheckCircle2, AlertTriangle, FileSearch, Activity, ArrowRight } from "lucide-react";

export function PaymentLifecycle({ exceptions, openCases, alerts }: { exceptions: number; openCases: number; alerts: number }) {
  const steps = [
    { label: "Processing", detail: "Scenario prepared", href: "/workspace/payments", Icon: CheckCircle2, state: "complete" },
    { label: "Reconciliation", detail: exceptions > 0 ? `${exceptions} exception${exceptions === 1 ? "" : "s"} need review` : "No exceptions in saved results", href: "/workspace/reconciliation", Icon: AlertTriangle, state: exceptions > 0 ? "attention" : "complete" },
    { label: "Investigation", detail: openCases > 0 ? `${openCases} open case${openCases === 1 ? "" : "s"}` : "No open cases", href: "/workspace/investigations", Icon: FileSearch, state: openCases > 0 ? "attention" : "neutral" },
    { label: "Monitoring", detail: alerts > 0 ? `${alerts} alert${alerts === 1 ? "" : "s"} recorded` : "No alerts recorded", href: "/workspace/monitoring", Icon: Activity, state: alerts > 0 ? "attention" : "neutral" },
  ];
  return <section aria-label="Payment lifecycle based on saved scenario" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <div className="mb-5"><h3 className="text-lg font-semibold text-slate-900">Payment lifecycle</h3><p className="mt-1 text-sm text-slate-600">Select a stage to inspect its actual saved evidence. These are scenario summaries, not live banking events.</p></div>
    <ol className="grid gap-3 md:grid-cols-4">{steps.map(({ label, detail, href, Icon, state }, index) => <li key={label} className="relative">
      <Link href={href} className="fireops-interactive group flex h-full min-h-36 flex-col rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-400 focus-visible:outline-blue-500">
        <div className="flex items-center justify-between"><span className="font-mono text-xs text-slate-500">0{index + 1}</span><Icon size={20} className={state === "attention" ? "text-amber-600" : state === "complete" ? "text-emerald-700" : "text-slate-500"} /></div>
        <strong className="mt-4 text-sm text-slate-900">{label}</strong><span className="mt-1 flex-1 text-xs leading-5 text-slate-600">{detail}</span><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">View stage <ArrowRight size={13}/></span>
      </Link>
    </li>)}</ol>
  </section>;
}
