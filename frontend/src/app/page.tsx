import { ArrowRight, ShieldCheck } from "lucide-react";
import OperationsWorkspace from "./operations-workspace";
import ReconciliationWorkspace from "./reconciliation-workspace";
import MonitoringWorkspace from "./monitoring-workspace";

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-16">
        <header className="flex items-center justify-between">
          <a href="#top" className="font-semibold tracking-tight text-slate-950">
            FireOps Lab
          </a>
          <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
            Independent portfolio project
          </span>
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
                href="#operations"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700"
              >
                Open operations lab <ArrowRight aria-hidden="true" size={18} />
              </a>
              <a
                href="#method"
                className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800 hover:bg-slate-50"
              >
                Project boundaries
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

        <ReconciliationWorkspace />
        <OperationsWorkspace />
        <MonitoringWorkspace />

        <section id="method" className="pb-10 text-sm leading-6 text-slate-600">
          <h2 className="text-base font-semibold text-slate-900">Method and limits</h2>
          <p className="mt-2 max-w-3xl">
            Monitoring alerts are explainable prompts for human review. They are not presented as
            proven fraud, money laundering, regulatory reporting, or legal compliance.
          </p>
        </section>
      </div>
    </main>
  );
}
