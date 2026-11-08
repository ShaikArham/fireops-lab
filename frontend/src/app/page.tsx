import { ArrowRight, ShieldCheck } from "lucide-react";
import SiteNavigation from "./site-navigation";
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
        <div className="mx-auto flex max-w-5xl flex-col gap-10 sm:gap-14">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <a href="#top" className="font-semibold tracking-tight text-slate-950">
              FireOps Lab
            </a>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Independent portfolio project
            </span>
            <SiteNavigation />
          </header>

          <section
            id="top"
            tabIndex={-1}
            className="grid gap-8 py-4 md:grid-cols-[1.4fr_0.8fr] md:items-center md:py-8"
          >
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-teal-800">
                Payment operations sandbox
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-6xl">
                Reconcile the day. Understand every exception.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Built by Shaik Arham to show how I approach payment discrepancies: compare the
                records, investigate the exception, and document a decision supported by evidence.
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
                  About my application
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

          <p className="rounded-xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm leading-6 text-teal-950">
            <strong>
              {process.env.NEXT_PUBLIC_API_BASE_URL ? "API workspace." : "Public sample edition."}
            </strong>{" "}
            {process.env.NEXT_PUBLIC_API_BASE_URL
              ? "Use fictional CSV files only. Actions update the configured demo environment."
              : "Explore reconciliation evidence, a worked investigation, monitoring rules and a downloadable sample summary. Imports and saved decisions run in the separate API environment shown in the optional recording."}
          </p>

          <section aria-labelledby="journey-heading" className=" grid gap-3 sm:grid-cols-3">
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

          <OperationsWorkspace />
          <ReconciliationWorkspace />
          <MonitoringWorkspace />
          <InsightsWorkspace />

          <section
            id="walkthrough"
            tabIndex={-1}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
            aria-labelledby="walkthrough-heading"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">
              Optional recorded walkthrough · 69 seconds
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
            <details className="mt-4 rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
              <summary className="cursor-pointer font-semibold">
                Read the walkthrough without video
              </summary>
              <ol className="mt-3 list-inside list-decimal space-y-2">
                <li>
                  Validate fictional payment and settlement CSV files, then import each source once.
                </li>
                <li>Simulate a payment batch and inspect its recorded status changes.</li>
                <li>Compare the exception-day source batches using explicit matching rules.</li>
                <li>
                  Open an unmatched item, record evidence and retain a reason for each case
                  decision.
                </li>
                <li>
                  Review a monitoring alert, consider a benign explanation and prepare a simulated
                  internal escalation.
                </li>
                <li>Download the saved run’s CSV and review the independent project boundaries.</li>
              </ol>
              <p className="mt-3">
                This is a written overview of the silent capture, not a spoken transcript. The
                recording shows a separate API-backed environment.
              </p>
            </details>
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
                Download thumbnail
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

          <section id="method" tabIndex={-1} className="pb-10" aria-labelledby="method-heading">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-800">
              About my application · Operations Analyst
            </p>
            <h2
              id="method-heading"
              className="mt-2 text-3xl font-semibold tracking-tight text-slate-950"
            >
              The work behind my application
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-slate-700">
              I’m Shaik Arham, based in Dublin. My background combines enterprise BI work at Hitachi
              Digital Services with an MSc in Computing (Data Analytics) at Dublin City University.
              I built FireOps Lab to make my approach to operational analysis visible through a
              practical example.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-950">Why I’m applying to Fire</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  The Operations Analyst opportunity interests me because it brings together payment
                  processing, reconciliation, exception investigation and careful documentation. I
                  enjoy work where a discrepancy has to be traced to its source and the next action
                  needs a clear reason.
                </p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-950">What I bring</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  At Hitachi, I worked with SQL and PL/SQL, reporting, ETL monitoring, data
                  validation and failure investigation. Those experiences shaped how I check source
                  records, document findings and communicate an issue. This project applies those
                  transferable skills to fictional payment operations.
                </p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-950">What I built</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  CSV validation and imports, simulated payment lifecycle events, deterministic
                  reconciliation, exception cases with audit history, explainable monitoring rules
                  and run-scoped reporting. The public sample and the API workspace have different
                  capabilities, stated beside each workflow.
                </p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-950">How I built and checked it</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Next.js and TypeScript present the workflow. FastAPI and a relational database
                  retain the source records and decisions. Automated tests cover matching,
                  controlled status changes and browser journeys. Versioned rules and fictional
                  fixtures make the results inspectable.
                </p>
              </article>
            </div>
            <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-5">
              <h3 className="font-semibold text-slate-950">What I found most interesting</h3>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                A missing settlement does not automatically mean a failed payment. The useful work
                is establishing what the records prove, identifying what is missing and keeping an
                item unresolved until the evidence supports a decision. The{" "}
                <a className="font-medium text-teal-900 underline" href="#investigation">
                  worked investigation
                </a>{" "}
                shows that approach.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white"
                href="https://github.com/ShaikArham/fireops-lab"
              >
                Inspect the source code
              </a>
              <a
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium"
                href="https://github.com/ShaikArham/fireops-lab/blob/main/docs/DEVELOPMENT.md"
              >
                Run the API workspace locally
              </a>
              <a
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium"
                href="https://github.com/ShaikArham/fireops-lab/actions"
              >
                View automated checks
              </a>
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
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-5 text-sm text-slate-600">
            <p>Shaik Arham · FireOps Lab · Fictional data only</p>
            <a className="inline-flex min-h-11 items-center text-teal-900 underline" href="#top">
              Back to top
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}
