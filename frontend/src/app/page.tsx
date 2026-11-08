import { ArrowRight, ShieldCheck } from "lucide-react";
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
      <main id="main-content" className="min-h-screen px-5 py-8 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-16">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <a href="#top" className="font-semibold tracking-tight text-slate-950">
              FireOps Lab
            </a>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Independent portfolio project
            </span>
            <details className="relative w-full sm:hidden">
              <summary className="min-h-11 cursor-pointer list-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-800">
                Explore sections
              </summary>
              <nav
                aria-label="Main sections"
                className="absolute left-0 right-0 top-12 z-20 grid gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
              >
                <a
                  className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50"
                  href="#walkthrough"
                >
                  Video walkthrough
                </a>
                <a
                  className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50"
                  href="#reconciliation"
                >
                  Payment day and reconciliation
                </a>
                <a
                  className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50"
                  href="#investigation"
                >
                  Investigation walkthrough
                </a>
                <a
                  className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50"
                  href="#monitoring"
                >
                  Monitoring rules
                </a>
                <a
                  className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50"
                  href="#insights"
                >
                  Operational insights
                </a>
                <a
                  className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50"
                  href="#method"
                >
                  About and method
                </a>
              </nav>
            </details>
            <nav
              aria-label="Main sections"
              className="hidden w-full flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-3 text-sm font-medium text-slate-700 sm:flex"
            >
              <a className="hover:text-teal-900" href="#reconciliation">
                Payment day
              </a>
              <a className="hover:text-teal-900" href="#walkthrough">
                Walkthrough
              </a>
              <a className="hover:text-teal-900" href="#investigation">
                Investigation
              </a>
              <a className="hover:text-teal-900" href="#monitoring">
                Monitoring
              </a>
              <a className="hover:text-teal-900" href="#insights">
                Insights
              </a>
              <a className="hover:text-teal-900" href="#method">
                About and method
              </a>
            </nav>
          </header>

          <section
            id="top"
            className="grid gap-10 py-8 md:grid-cols-[1.4fr_0.8fr] md:items-center md:py-16"
          >
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">
                Payment operations sandbox
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-6xl">
                Reconcile the day. Understand every exception.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                A portfolio project for exploring payment and settlement operations with transparent
                rules and fictional records.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#reconciliation"
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700"
                >
                  Start sample investigation <ArrowRight aria-hidden="true" size={18} />
                </a>
                <a
                  href="#method"
                  className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800 hover:bg-slate-50"
                >
                  Project boundaries
                </a>
                <a
                  href="#walkthrough"
                  className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800 hover:bg-slate-50"
                >
                  Watch the full walkthrough
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
              A three-step operations journey
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

          <section
            id="walkthrough"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
            aria-labelledby="walkthrough-heading"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">
              Full website walkthrough · 69 seconds
            </p>
            <h2 id="walkthrough-heading" className="mt-2 text-2xl font-semibold text-slate-950">
              See the complete synthetic operations journey
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Follow file validation, payment simulation, reconciliation, case review, monitoring
              and the run-scoped CSV export. This review cut has no spoken narration; the English
              captions describe each visible step.
            </p>
            <video
              className="mt-5 aspect-video w-full rounded-xl bg-slate-950"
              controls
              playsInline
              preload="metadata"
              poster="videos/fireops-lab-walkthrough-thumbnail.webp"
              aria-label="Silent FireOps Lab website walkthrough with English descriptive captions"
            >
              <source src="videos/fireops-lab-walkthrough.mp4" type="video/mp4" />
              <track
                default
                kind="captions"
                label="English descriptive captions"
                src="videos/fireops-lab-walkthrough.vtt"
                srcLang="en"
              />
              Your browser does not support HTML video. Download the{" "}
              <a href="videos/fireops-lab-walkthrough.mp4">MP4 walkthrough</a>.
            </video>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
              <a
                className="text-teal-900 underline"
                href="videos/fireops-lab-walkthrough.mp4"
                download
              >
                Download MP4
              </a>
              <a
                className="text-teal-900 underline"
                href="videos/fireops-lab-walkthrough-thumbnail.webp"
                download
              >
                Download WebP thumbnail
              </a>
              <a
                className="text-teal-900 underline"
                href="videos/fireops-lab-walkthrough.vtt"
                download
              >
                Download captions
              </a>
            </div>
          </section>

          <ReconciliationWorkspace />
          <OperationsWorkspace />
          <MonitoringWorkspace />
          <InsightsWorkspace />

          <section id="method" className="pb-10" aria-labelledby="method-heading">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">
              Role alignment · Operations Analyst
            </p>
            <h2 id="method-heading" className="mt-2 text-2xl font-semibold text-slate-950">
              Show the work behind a careful operations decision
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
            <h3 className="mt-5 font-semibold text-slate-900">Method and limits</h3>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">
              FireOps Lab is an independent portfolio project built with fictional data. It
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
