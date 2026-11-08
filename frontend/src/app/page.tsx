import Link from "next/link";
import { ArrowRight, Code2, PlayCircle } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white sm:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold">FireOPS <span className="text-teal-300">Lab</span></Link>
          <Link href="/workspace/overview" className="rounded-lg border border-slate-600 px-4 py-3 text-sm font-semibold hover:bg-slate-800">Skip introduction →</Link>
        </header>
        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-300">Independent payment operations simulation</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">When a payment succeeds but settlement doesn't match, what happens next?</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Explore a fictional payment day from processing and reconciliation to investigation, escalation and monitoring. Built by Shaik Arham Saquib to demonstrate operational problem-solving.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/workspace/overview" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-teal-300 px-6 py-3 font-semibold text-slate-950 hover:bg-teal-200">Explore FireOPS <ArrowRight size={18} /></Link>
              <Link href="/workspace/payments" className="inline-flex min-h-12 items-center rounded-lg border border-slate-600 px-6 py-3 font-semibold hover:bg-slate-800">Go to payments</Link>
            </div>
          </div>
          <section aria-label="Film introduction" className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 px-6 text-center">
              <PlayCircle className="text-teal-300" size={58} aria-hidden="true" />
              <h2 className="text-xl font-semibold">The FireOPS introduction film</h2>
              <p className="max-w-sm text-sm leading-6 text-slate-300">The narrated film is in production. The interactive workspace is available now.</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-slate-300"><span>Real workflows · Fictional records</span><Link className="font-semibold text-teal-300 hover:underline" href="/workspace/overview">Open the full workspace →</Link></div>
          </section>
        </div>
        <footer className="mt-16 flex flex-wrap justify-between gap-4 border-t border-slate-700 pt-6 text-sm text-slate-400"><span>Independent portfolio project. Not affiliated with fire.com. No real payments.</span><a href="https://github.com/ShaikArham/fireops-lab" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-200 hover:underline"><Code2 size={16}/> View code on GitHub</a></footer>
      </div>
    </main>
  );
}
