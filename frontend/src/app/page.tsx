"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Code2, PlayCircle, X } from "lucide-react";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/workspace/overview");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <div
        className="fixed inset-0 bg-black/60"
        aria-hidden="true"
        onClick={() => router.push("/workspace/overview")}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="film-title"
        aria-describedby="film-description"
        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl motion-safe:animate-[fireops-enter_650ms_cubic-bezier(0.22,1,0.36,1)_both]"
      >
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4 sm:px-8">
          <span className="text-xl font-bold">
            FireOPS <span className="text-teal-300">Lab</span>
          </span>
          <Link
            href="/workspace/overview"
            aria-label="Close introduction and explore overview"
            className="rounded-lg border border-slate-600 p-2 hover:bg-slate-800"
          >
            <X size={20} />
          </Link>
        </div>
        <div className="grid gap-7 p-6 sm:p-9 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-300">
              Independent operations simulation
            </p>
            <h1 id="film-title" className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
              When a payment succeeds but settlement doesn't match, what happens next?
            </h1>
            <p id="film-description" className="mt-4 text-sm leading-7 text-slate-300">
              Explore fictional payment processing, reconciliation, investigations and monitoring.
              Built by Shaik Arham to demonstrate evidence-led operational thinking.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/workspace/overview"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-teal-300 px-5 py-3 font-semibold text-slate-950 hover:bg-teal-200"
              >
                Explore FireOPS <ArrowRight size={18} />
              </Link>
              <Link
                href="/workspace/payments"
                className="inline-flex min-h-12 items-center rounded-lg border border-slate-600 px-5 py-3 font-semibold hover:bg-slate-800"
              >
                Payments
              </Link>
            </div>
          </div>
          <div className="relative flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-teal-950 px-5 text-center">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(94,234,212,.10)_1px,transparent_1px),linear-gradient(90deg,rgba(94,234,212,.10)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
            <div aria-hidden="true" className="relative mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-teal-200"><span className="h-3 w-3 rounded-full bg-teal-300 motion-safe:animate-pulse" /><span className="h-px w-10 bg-teal-500/70" /><span className="rounded-md border border-amber-400/60 bg-amber-400/10 px-2 py-1 text-amber-200">EXCEPTION</span /><span className="h-px w-10 bg-teal-500/70" /><span className="h-3 w-3 rounded-full border border-teal-300" /></div>
            <PlayCircle size={52} className="relative text-teal-300 transition-transform duration-300 motion-safe:hover:scale-105" aria-hidden="true" />
            <h2 className="text-lg font-semibold">FireOPS introduction film</h2>
            <p className="max-w-xs text-sm leading-6 text-slate-300">
              Film in production. You can explore the interactive application now.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-700 px-6 py-8 sm:px-9">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Follow the exception</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">One payment. Three decisions.</h2>
            </div>
            <p className="max-w-xs text-sm text-slate-400">Scroll to see how a fictional exception becomes a documented investigation.</p>
          </div>
          <div className="space-y-4" aria-label="Illustrative payment operations journey">
            {[
              { number: "01", label: "PROCESS", title: "Follow the payment", body: "Trace a fictional payment batch from processing toward settlement.", tone: "text-teal-300" },
              { number: "02", label: "RECONCILE", title: "Find the mismatch", body: "Compare records and identify the exception requiring review.", tone: "text-amber-300" },
              { number: "03", label: "INVESTIGATE", title: "Document the decision", body: "Review supporting evidence, monitor alerts and explain the outcome.", tone: "text-sky-300" },
            ].map((step, index) => (
              <article
                key={step.number}
                className="fireops-scroll-card sticky rounded-2xl border border-slate-700 bg-slate-900/95 p-5 shadow-[0_18px_40px_rgba(0,0,0,.3)] sm:p-7"
                style={{ top: `${16 + index * 12}px` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-xs font-bold tracking-[0.18em] ${step.tone}`}>{step.label}</span>
                  <span className="font-mono text-sm text-slate-500">{step.number} / 03</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold sm:text-2xl">{step.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{step.body}</p>
                <div aria-hidden="true" className="mt-6 h-1 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-teal-300" style={{ width: `${(index + 1) * 100 / 3}%` }} />
                </div>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs text-slate-400">Illustrative workflow · Fictional records only</p>
          <Link href="/workspace/overview" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-teal-500/60 px-4 py-2 font-semibold text-teal-200 transition-colors hover:bg-teal-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300">Open interactive workspace <ArrowRight size={17} /></Link>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 px-6 py-4 text-xs text-slate-400 sm:px-9">
          <span>Fictional records only · Not affiliated with fire.com</span>
          <a
            href="https://github.com/ShaikArham/fireops-lab"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-slate-200 hover:underline"
          >
            <Code2 size={15} /> View code on GitHub
          </a>
        </footer>
      </section>
      <style jsx global>{`@supports (animation-timeline: view()) { .fireops-scroll-card { animation: fireops-card-reveal linear both; animation-timeline: view(); animation-range: entry 0% entry 75%; } } @keyframes fireops-card-reveal { from { opacity: .65; transform: translateY(18px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } } @media (prefers-reduced-motion: reduce) { .fireops-scroll-card { animation: none !important; transform: none !important; } } @keyframes fireops-enter { from { opacity: 0; transform: translateY(16px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
    </main>
  );
}
