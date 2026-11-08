import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  Scale,
  SearchCheck,
} from "lucide-react";
import OperationsWorkspace from "../../operations-workspace";
import ReconciliationWorkspace from "../../reconciliation-workspace";
import MonitoringWorkspace from "../../monitoring-workspace";
import InsightsWorkspace from "../../insights-workspace";
import CaseWorkspace from "../../case-workspace";
import ApiConnectionStatus from "../../api-connection-status";

const sections = [
  { slug: "overview", label: "Overview", Icon: LayoutDashboard },
  { slug: "payments", label: "Payments", Icon: CreditCard },
  { slug: "reconciliation", label: "Reconciliation", Icon: Scale },
  { slug: "investigations", label: "Investigations", Icon: SearchCheck },
  { slug: "monitoring", label: "Monitoring", Icon: Activity },
  { slug: "insights", label: "Insights", Icon: ChartNoAxesCombined },
  { slug: "about", label: "About the builder", Icon: BookOpen },
] as const;
type Section = (typeof sections)[number]["slug"];

export function generateStaticParams() {
  return sections.map(({ slug }) => ({ section: slug }));
}

export default async function WorkspacePage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.some((item) => item.slug === section)) {
    return (
      <main className="p-10">
        <h1>Workspace not found</h1>
        <Link href="/workspace/overview">Return to overview</Link>
      </main>
    );
  }
  const current = section as Section;
  const title = sections.find((item) => item.slug === current)?.label ?? "Overview";
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-950 px-4 py-7 text-slate-100 lg:flex">
        <Link href="/workspace/overview" className="px-3 text-xl font-bold">
          FireOPS <span className="text-teal-300">Lab</span>
        </Link>
        <p className="mb-8 mt-2 px-3 text-xs text-slate-400">Payment operations workspace</p>
        <nav aria-label="Workspace navigation" className="grid gap-1 text-sm">
          {sections.map(({ slug, label, Icon }) => (
            <Link
              key={slug}
              href={`/workspace/${slug}`}
              aria-current={slug === current ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 transition ${slug === current ? "bg-teal-800 text-white" : "text-slate-200 hover:bg-slate-800"}`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto rounded-xl border border-slate-700 p-3 text-xs leading-5 text-slate-300">
          Synthetic demo data only. No real banking connections or payment execution.
        </p>
      </aside>
      <div className="border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/workspace/overview" className="font-bold">
            FireOPS Lab
          </Link>
          <details className="relative">
            <summary className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm">
              ☰ Workspaces
            </summary>
            <nav
              aria-label="Mobile workspace navigation"
              className="absolute right-0 top-12 z-50 grid w-60 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
            >
              {sections.map(({ slug, label }) => (
                <Link
                  key={slug}
                  href={`/workspace/${slug}`}
                  className="rounded-lg px-3 py-3 text-sm hover:bg-slate-100"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
      <main id="main-content" className="mx-auto max-w-7xl px-5 py-8 sm:px-9">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
              Operations / {title}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            Synthetic environment
          </span>
        </header>
        <ApiConnectionStatus />
        {current === "overview" && (
          <div className="space-y-8">
            <div className="rounded-2xl bg-slate-950 p-7 text-white sm:p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-300">
                Payment operations
              </p>
              <h2 className="mt-3 text-3xl font-semibold">Review the payment day.</h2>
              <p className="mt-3 max-w-2xl text-slate-300">
                Validate a batch, examine settlement exceptions, review monitoring signals and
                document the next evidence-based action.
              </p>
              <Link
                href="/workspace/payments"
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Open payment operations <ArrowRight size={17} />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  name: "01 / Process",
                  text: "Validate synthetic source files and inspect payment lifecycle events.",
                  slug: "payments",
                },
                {
                  name: "02 / Reconcile",
                  text: "Compare payment instructions with settlement evidence and classify discrepancies.",
                  slug: "reconciliation",
                },
                {
                  name: "03 / Investigate",
                  text: "Review exception evidence and determine the next justified action.",
                  slug: "investigations",
                },
              ].map((item) => (
                <Link
                  key={item.slug}
                  href={`/workspace/${item.slug}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-teal-700"
                >
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </Link>
              ))}
            </div>
            <div className="scroll-reveal rounded-xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
                About the builder
              </p>
              <h2 className="mt-2 text-xl font-semibold">Shaik Arham Saquib</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Dublin-based BI and application operations professional with 2.5+ years of
                experience at Hitachi Digital Services and an MSc in Computing (Data Analytics) from
                Dublin City University.
              </p>
              <Link
                href="/workspace/about"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-800"
              >
                Read my background <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
        {current === "payments" && <OperationsWorkspace />}
        {current === "reconciliation" && <ReconciliationWorkspace />}
        {current === "investigations" && (
          <div className="space-y-4">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              The case queue loads saved investigations when the backend is connected. To open a new
              case, start from a reconciliation exception.
            </p>
            <CaseWorkspace results={[]} />
          </div>
        )}
        {current === "monitoring" && <MonitoringWorkspace />}
        {current === "insights" && <InsightsWorkspace />}
        {current === "about" && (
          <div className="max-w-3xl space-y-5 rounded-xl border border-slate-200 bg-white p-7">
            <h2 className="text-2xl font-semibold">Shaik Arham Saquib</h2>
            <p className="leading-7 text-slate-700">
              I have 2.5+ years of business intelligence and application operations experience at
              Hitachi Digital Services, working with SQL, ETL monitoring, data validation,
              reporting, incident investigation and operational handovers. I completed an MSc in
              Computing (Data Analytics) at Dublin City University.
            </p>
            <p className="leading-7 text-slate-700">
              I developed FireOPS Lab to demonstrate careful, evidence-based reasoning about payment
              and settlement operations. The system uses fictional records and is not connected to
              Fire Financial Services Limited or any banking network. It does not represent
              professional fraud or AML investigation experience.
            </p>
            <h3 className="text-xl font-semibold">
              Why I built this for the Operations Analyst role
            </h3>
            <p className="leading-7 text-slate-700">
              I’m interested in the work between a payment instruction and reliable settlement:
              checking the evidence, explaining an exception and leaving a clear handover. My
              experience monitoring ETL jobs, validating SQL results and investigating reporting
              failures gives me a practical foundation for learning payment operations at Fire.
            </p>
            <h3 className="text-xl font-semibold">How the project works</h3>
            <p className="leading-7 text-slate-700">
              The Next.js workspace calls a FastAPI service. PostgreSQL keeps source records,
              reconciliation results, cases and their activity histories. Amounts use integer minor
              units, imports use checksums, and monitoring rules show their evidence and possible
              benign explanations. Each visitor works in a separate, temporary synthetic workspace.
            </p>
            <h3 className="text-xl font-semibold">What I find interesting</h3>
            <p className="leading-7 text-slate-700">
              A mismatch is a reason to investigate, not a conclusion. I designed the workflow
              around that distinction: preserve the source records, make the matching rule visible,
              record the analyst’s reasoning and escalate when another review is needed. Automated
              checks support judgment without pretending to replace it.
            </p>
            <p className="text-sm leading-6 text-slate-600">
              This demonstrates a learning project, not production banking experience, a regulatory
              compliance certification or an automated fraud verdict.
            </p>
            <a
              href="https://github.com/ShaikArham/fireops-lab"
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Inspect implementation on GitHub ↗
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
