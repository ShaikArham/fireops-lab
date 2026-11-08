"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Play, RotateCcw } from "lucide-react";

const steps = [
  { title: "Start with the payment", description: "Open the Payments workspace to inspect a fictional payment batch and its processing evidence.", href: "/workspace/payments", action: "Explore payments" },
  { title: "Find the exception", description: "Move to Reconciliation to compare payment and settlement records. Investigate what does not match.", href: "/workspace/reconciliation", action: "Review reconciliation" },
  { title: "Document a decision", description: "Open Investigations to inspect case evidence, record notes and follow the case history.", href: "/workspace/investigations", action: "Open investigations" },
  { title: "Monitor and explain", description: "Review monitoring signals, then inspect saved reporting metrics and definitions.", href: "/workspace/insights", action: "View insights" },
];
export function GuidedDemo() {
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const step = steps[active];
  return <section id="guided-demo" aria-labelledby="guided-demo-title" className="bg-[#0b1220] px-5 py-20 text-white sm:px-10">
    <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[.85fr_1.15fr] md:items-center">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#93b8ff]">Reviewer walkthrough</p><h2 id="guided-demo-title" className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Explore the workflow, not just the screenshots.</h2><p className="mt-5 text-base leading-7 text-slate-300">Four short steps introduce the real application. You remain in control and can jump directly to each workspace.</p></div>
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8">
        {!started ? <div><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[#548cff]"><Play size={24}/></div><h3 className="text-2xl font-semibold">Start the guided tour</h3><p className="mt-3 text-sm leading-6 text-slate-300">A self-paced introduction to the fictional payment operations journey. No real payments are processed.</p><button type="button" onClick={() => setStarted(true)} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#548cff] px-5 font-semibold text-white hover:bg-[#376fdf]">Begin walkthrough <ArrowRight size={17}/></button></div> :
        <div><p className="font-mono text-xs text-[#93b8ff]">STEP {active + 1} OF {steps.length}</p><div aria-hidden="true" className="mt-4 flex gap-2">{steps.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= active ? "bg-[#548cff]" : "bg-slate-700"}`}/>)}</div><h3 className="mt-7 text-2xl font-semibold">{step.title}</h3><p className="mt-3 min-h-20 text-sm leading-7 text-slate-300">{step.description}</p><Link href={step.href} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#548cff] px-5 font-semibold text-white hover:bg-[#376fdf]">{step.action} <ArrowRight size={17}/></Link><div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-5"><button type="button" disabled={active === 0} onClick={() => setActive(i => Math.max(0, i - 1))} className="inline-flex min-h-11 items-center gap-1 text-sm text-slate-300 disabled:opacity-40"><ArrowLeft size={15}/> Back</button>{active === steps.length - 1 ? <button type="button" onClick={() => { setActive(0); setStarted(false); }} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white"><RotateCcw size={15}/> Restart</button> : <button type="button" onClick={() => setActive(i => Math.min(steps.length - 1, i + 1))} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white">Next step <ArrowRight size={15}/></button>}</div></div>}
      </div>
    </div>
  </section>;
}
