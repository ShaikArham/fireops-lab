import { ArrowRight, ShieldCheck, LayoutDashboard, CreditCard, Scale, SearchCheck, Activity, ChartNoAxesCombined, BookOpen } from "lucide-react";
import OperationsWorkspace from "./operations-workspace";
import ReconciliationWorkspace from "./reconciliation-workspace";
import MonitoringWorkspace from "./monitoring-workspace";
import InsightsWorkspace from "./insights-workspace";

export default function Home() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <main id="main-content" className="min-h-screen lg:pl-64">\n        <aside aria-label="Workspace sidebar" className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-slate-950 px-4 py-7 text-slate-100 lg:flex">\n          <a href="/workspace/overview" className="mb-2 px-3 text-xl font-bold tracking-tight">FireOPS <span className="text-teal-300">Lab</span></a>\n          <p className="mb-8 px-3 text-xs text-slate-400">Payment operations workspace</p>\n          <nav className="grid gap-1 text-sm" aria-label="Primary workspace navigation">\n            {[[LayoutDashboard,"Overview","#top"],[CreditCard,"Payments","#payments"],[Scale,"Reconciliation","#reconciliation"],[SearchCheck,"Investigations","#investigation"],[Activity,"Monitoring","#monitoring"],[ChartNoAxesCombined,"Insights","#insights"],[BookOpen,"About the builder","#method"]].map(([Icon,label,href]) => { const NavIcon = Icon as typeof LayoutDashboard; return <a key={href as string} href={href as string} className="flex items-center gap-3 rounded-lg px-3 py-3 text-slate-200 transition hover:bg-slate-800 hover:text-white"><NavIcon size={18} aria-hidden="true" />{label as string}</a>; })}\n          </nav>\n          <div className="mt-auto rounded-xl border border-slate-700 p-3 text-xs leading-5 text-slate-300">Synthetic data only. No real payments or banking connections.</div>\n        </aside>
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-7 sm:px-8 lg:px-10">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5 lg:hidden">
            <span className="font-semibold text-slate-950">FireOPS Lab</span>
            <details className="relative">
              <summary className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">☰ Menu</summary>
              <nav aria-label="Mobile workspace navigation" className="absolute right-0 top-12 z-50 grid w-60 gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <a href="#top" className="rounded-lg p-3 hover:bg-slate-100">Overview</a>
                <a href="#payments" className="rounded-lg p-3 hover:bg-slate-100">Payments</a>
                <a href="#reconciliation" className="rounded-lg p-3 hover:bg-slate-100">Reconciliation</a>
                <a href="#investigation" className="rounded-lg p-3 hover:bg-slate-100">Investigations</a>
                <a href="#monitoring" className="rounded-lg p-3 hover:bg-slate-100">Monitoring</a>
                <a href="#insights" className="rounded-lg p-3 hover:bg-slate-100">Insights</a>
                <a href="#method" className="rounded-lg p-3 hover:bg-slate-100">About &amp; method</a>
              </nav>
            </details>
          </header>

          <section
            id="top"
            className="grid gap-10 py-8 md:grid-cols-[1.4fr_0.8fr] md:items-center md:py-16"
          >
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">
                OPERATIONS / OVERVIEW
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-6xl">
                Payment operations overview
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                A portfolio project for exploring payment and settlement operations with transparent
                rules and fictional records.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/workspace/overview"
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700"
                >
                  Open operations workspace <ArrowRight aria-hidden="true" size={18} />
                </a>
                <a
                  href="#method"
                  className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800 hover:bg-slate-50"
                >
                  About this environment
                </a>
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                <ShieldCheck aria-hidden="true" size={23} />
              </div>
              <h2 className="text-lg font-semibold text-slate-950">Fictional data only</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This sandbox does not move money, connect to banking systems, or make real fraud or
                AML decisions.
              </p>
              <p className="mt-4 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
                FireOps Lab is independent and is not affiliated with, commissioned by, endorsed by,
                or connected to Fire Financial Services Limited.
              </p>
            </aside>
          </section>

          <section aria-labelledby="journey-heading" className="-mt-8 grid gap-3 sm:grid-cols-3">
            <h2 id="journey-heading" className="sr-only">
              Operations workflow
            </h2>
            <a
              href="#reconciliation"
              className="rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-700"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                01 · compare
              </span>
              <span className="mt-1 block font-semibold text-slate-950">
                Match payment and settlement evidence
              </span>
            </a>
            <a
              href="#investigation"
              className="rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-700"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                02 · investigate
              </span>
              <span className="mt-1 block font-semibold text-slate-950">
                Choose the next evidence-based check
              </span>
            </a>
            <a
              href="#insights"
              className="rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-700"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                03 · improve
              </span>
              <span className="mt-1 block font-semibold text-slate-950">
                Review defined operational measures
              </span>
            </a>
          </section>

          <ReconciliationWorkspace />
          <div id="payments" className="scroll-mt-8"><OperationsWorkspace /></div>
          <MonitoringWorkspace />
          <InsightsWorkspace />

          <section aria-label="Builder introduction" className="scroll-reveal rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white sm:p-9">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Behind the workspace</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Built by Shaik Arham Saquib</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">Business intelligence and application operations experience, combined with postgraduate data analytics. Explore the working operations scenarios first, then see the decisions and engineering behind them.</p>
              </div>
              <a href="/workspace/about" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-50">Meet the builder <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
          </section>

          <section id="method" className="pb-10" aria-labelledby="method-heading">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">
              ABOUT THE BUILDER
            </p>
            <h2 id="method-heading" className="mt-2 text-2xl font-semibold text-slate-950">
              Built by Shaik Arham Saquib
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-950">Process and reconcile</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Follow synthetic payment batches, settlement records, control totals and
                  explainable matching outcomes.
                </p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-950">Investigate exceptions</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Compare source evidence, identify the next check and keep an unresolved item
                  unresolved until evidence supports a decision.
                </p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-950">Review monitoring signals</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Inspect deterministic rules, source evidence and benign explanations before any
                  human disposition.
                </p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-950">Measure and improve</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use defined sample denominators and distinguish measured fixture counts from
                  hypothetical workload assumptions.
                </p>
              </article>
            </div>
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm leading-7 text-slate-700">
                I am a Dublin-based computing graduate with 2.5+ years of business intelligence and application operations experience at Hitachi Digital Services, alongside an MSc in Computing (Data Analytics) from Dublin City University. My work has involved SQL, ETL monitoring, incident investigation, reporting, data validation and operational handovers.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                I built this environment to demonstrate how I approach evidence-based reconciliation, exception investigation, operational controls and clear escalation. The scenarios and records are synthetic; this is not a claim of professional payment-operations experience.
              </p>
              <a className="mt-4 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50" href="https://github.com/ShaikArham/fireops-lab" target="_blank" rel="noreferrer">Review implementation on GitHub ↗</a>
            </div>
            <h3 className="mt-5 font-semibold text-slate-900">Environment and limitations</h3>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">
              FireOPS Lab is an independently developed synthetic payment operations simulator, not an official Fire product. It
              demonstrates transferable analytical and documentation skills, not professional
              payment-fraud investigation experience. Monitoring signals are prompts for trained
              human review, not presented as proven fraud, money laundering, legal compliance or
              regulatory reporting.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
