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
import DemoSessionControls from "../../demo-session-controls";
import AboutBuilder from "../../about-builder";
import JourneyNavigation from "../../journey-navigation";
import ScenarioSelector from "../../scenario-selector";
import LiveOverview from "../../live-overview";
import ThemeToggle from "../../theme-toggle";

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
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
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
      <nav aria-label="Quick workspace navigation" className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-5 py-2 lg:hidden">
        {sections.map(({ slug, label }) => (
          <Link
            key={slug}
            href={`/workspace/${slug}`}
            aria-current={slug === current ? "page" : undefined}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${slug === current ? "bg-teal-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <main id="main-content" className="mx-auto max-w-7xl px-5 py-8 sm:px-9">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
              Operations / {title}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              Synthetic environment
            </span>
          </div>
        </header>
        <DemoSessionControls enabled={current !== "about"}>
          {current !== "about" && <ScenarioSelector />}
          {current === "overview" && (
            <div className="space-y-8">
              <LiveOverview />
              <div className="rounded-2xl bg-slate-950 p-7 text-white sm:p-10">
                <p className="text-xs font-bold uppercase tracking-widest text-teal-300">
                  Payment operations
                </p>
                <h2 className="mt-3 text-3xl font-semibold">
                  A payment day, explained from start to finish.
                </h2>
                <p className="mt-3 max-w-2xl text-slate-300">
                  Follow a fictional payment batch through its lifecycle. See what was expected,
                  what actually settled, where the exceptions arose, how they were investigated and
                  what the resulting dashboard tells an operations team. No uploads or setup
                  required.
                </p>
                <Link
                  href="/workspace/payments"
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950"
                >
                  Explore the preloaded payments <ArrowRight size={17} />
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    name: "01 / Process",
                    text: "Inspect preloaded fictional payments and choose a batch from the selector.",
                    slug: "payments",
                  },
                  {
                    name: "02 / Reconcile",
                    text: "See which records match, which differ and why those differences matter.",
                    slug: "reconciliation",
                  },
                  {
                    name: "03 / Investigate",
                    text: "Select an exception, inspect its evidence and follow the investigation.",
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="scroll-reveal rounded-xl border border-slate-200 bg-white p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
                    04 / Monitor
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">What needs attention now?</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Review fictional alerts, priorities and operational signals in one dashboard.
                  </p>
                  <Link
                    href="/workspace/monitoring"
                    className="mt-4 inline-flex text-sm font-semibold text-teal-800"
                  >
                    Open monitoring →
                  </Link>
                </div>
                <div className="scroll-reveal rounded-xl border border-slate-200 bg-white p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
                    05 / Understand
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">What does the evidence show?</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Explore trends, exceptions and outcomes in the Insights dashboard.
                  </p>
                  <Link
                    href="/workspace/insights"
                    className="mt-4 inline-flex text-sm font-semibold text-teal-800"
                  >
                    Open insights →
                  </Link>
                </div>
              </div>
              <div className="scroll-reveal rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
                  About the builder
                </p>
                <h2 className="mt-2 text-xl font-semibold">Shaik Arham Saquib</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                  Dublin-based BI and application operations professional with 2.5+ years of
                  experience at Hitachi Digital Services and an MSc in Computing (Data Analytics)
                  from Dublin City University.
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
              <CaseWorkspace results={[]} />
            </div>
          )}
          {current === "monitoring" && <MonitoringWorkspace />}
          {current === "insights" && <InsightsWorkspace />}
          {current === "about" && <AboutBuilder />}
        </DemoSessionControls>
        <JourneyNavigation section={current} />
      </main>
    </div>
  );
}
