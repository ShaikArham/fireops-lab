import AboutScrollNavigator from "./about-scroll-navigator";

const strengths = [
  {
    title: "Data accuracy",
    detail:
      "SQL, PL/SQL, validation, reconciliation checks and tracing discrepancies to source records.",
  },
  {
    title: "Operational reliability",
    detail: "ETL and BI monitoring, incident handling, reporting support and clear handovers.",
  },
  {
    title: "Evidence-led investigation",
    detail:
      "Reconstructing what happened, documenting findings and avoiding unsupported conclusions.",
  },
  {
    title: "Learning in practice",
    detail: "Applying an analytical background to fictional payment and settlement workflows.",
  },
];

const career = [
  {
    dates: "MAR 2024 – JUL 2025",
    role: "Data Analyst",
    place: "Hitachi Digital Services",
    detail:
      "Oracle ODI and BI production monitoring, SQL and PL/SQL reconciliation, root-cause investigation, data validation and operational reporting.",
  },
  {
    dates: "FEB 2023 – MAR 2024",
    role: "ERP & Business Intelligence Analyst",
    place: "Hitachi Digital Services",
    detail:
      "Oracle ERP/EBS R12 and business intelligence operations, ETL monitoring, data integrity checks, troubleshooting and documentation.",
  },
  {
    dates: "MAY 2026 – PRESENT",
    role: "Security & Reception Officer",
    place: "SOS Group",
    detail:
      "Corporate reception, access control, incident documentation and coordination with facilities, IT and building management.",
  },
  {
    dates: "SEP 2025 – AUG 2026",
    role: "MSc Computing (Data Analytics)",
    place: "Dublin City University",
    detail: "Data management, analytics, machine learning and evidence-based research.",
  },
];

export default function AboutBuilder() {
  return (
    <div id="about-top" className="about-sections space-y-5 pb-6">
      <nav
        aria-label="About page sections"
        className="sticky top-0 z-20 -mx-2 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur"
      >
        {[
          ["intro", "Introduction"],
          ["approach", "My approach"],
          ["strengths", "Strengths"],
          ["background", "Background"],
          ["projects", "Projects & source code"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 focus-visible:bg-teal-50"
          >
            {label}
          </a>
        ))}
      </nav>
      <section
        id="intro"
        className="about-section overflow-hidden rounded-3xl bg-slate-950 text-white"
      >
        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-teal-300">
              The person behind FireOPS
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Built to show <span className="text-teal-300">how I think.</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              A personal, independent work sample exploring payment operations, reconciliation and
              evidence-based investigation for an Operations Analyst opportunity at fire.com.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <a href="https://shaikarham.github.io/arham-portfolio/" target="_blank" rel="noopener noreferrer" aria-label="View Shaik Arham portfolio" className="block w-40 shrink-0 overflow-hidden rounded-xl border border-teal-400/40 bg-slate-900 p-2 shadow-lg shadow-teal-500/20 sm:w-52"><img src="https://raw.githubusercontent.com/ShaikArham/arham-portfolio/main/assets/arham-avatar.webp" alt="Shaik Arham portfolio illustration with laptop" className="h-auto w-full object-contain" /></a>
              <div>
                <p className="font-semibold">Shaik Arham</p>
                <p className="text-sm text-slate-300">
                  Dublin, Ireland · MSc Computing (Data Analytics)
                </p>
              </div>
            </div>
          </div>
          <aside className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">
              The opportunity
            </p>
            <h3 className="mt-5 text-2xl font-semibold">Operations Analyst</h3>
            <p className="mt-2 text-slate-300">fire.com · Dublin</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {["SQL & validation", "Operational monitoring", "Investigations"].map((x) => (
                <span key={x} className="rounded-full border border-slate-600 px-3 py-2">
                  {x}
                </span>
              ))}
            </div>
            <a
              href="https://www.fire.com/careers/operations-analyst/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-teal-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-200"
            >
              View the official Operations Analyst position ↗
            </a>
            <p className="mt-5 text-xs leading-6 text-slate-400">
              Independent application project. Not affiliated with or endorsed by fire.com. No real
              payment processing.
            </p>
          </aside>
        </div>
      </section>
      <section
        id="approach"
        className="about-section grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-[.7fr_1.3fr] md:p-9"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
            01 / My approach
          </p>
          <h3 className="mt-3 text-2xl font-semibold">Why FireOPS?</h3>
        </div>
        <div className="space-y-4 leading-7 text-slate-700">
          <p className="text-xl font-medium text-slate-900">
            I wanted to demonstrate my approach to the work, not just describe it in a CV.
          </p>
          <p>
            At Hitachi Digital Services, I worked with enterprise BI, SQL, ETL monitoring, data
            validation and investigating reporting failures. FireOPS applies that same disciplined
            thinking to a fictional payment workflow: follow the record, reconcile the evidence,
            investigate an exception and explain the next action.
          </p>
          <p>
            This is a learning project, not a claim that I have worked in professional payment
            operations, fraud investigations or AML compliance.
          </p>
        </div>
      </section>
      <section
        id="strengths"
        className="about-section rounded-2xl border border-slate-200 bg-white p-6 md:p-9"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
          02 / Relevant strengths
        </p>
        <h3 className="mt-3 text-2xl font-semibold">What I bring to the role</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {strengths.map((item, i) => (
            <article key={item.title} className="rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-bold text-teal-800">0{i + 1}</p>
              <h4 className="mt-3 font-semibold">{item.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        id="background"
        className="about-section rounded-2xl border border-slate-200 bg-white p-6 md:p-9"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-teal-800">03 / Background</p>
        <h3 className="mt-3 text-2xl font-semibold">Experience & education</h3>
        <div className="mt-6 space-y-5">
          {career.map((item) => (
            <article
              key={item.dates}
              className="grid gap-2 border-l-2 border-teal-700 pl-5 md:grid-cols-[12rem_1fr]"
            >
              <p className="text-xs font-bold tracking-wide text-slate-500">{item.dates}</p>
              <div>
                <h4 className="font-semibold">{item.role}</h4>
                <p className="text-sm font-medium text-teal-800">{item.place}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section
        id="projects"
        className="about-section rounded-2xl border border-slate-200 bg-white p-6 md:p-9"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-teal-800">
          04 / Projects & source code
        </p>
        <h3 className="mt-3 text-2xl font-semibold">Explore the project and its source code</h3>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          FireOPS is an independent, fictional payment operations project built to demonstrate my
          approach to validation, reconciliation, monitoring and investigation. My wider portfolio
          includes other analytical and operational work.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="inline-flex min-h-11 items-center rounded-lg bg-teal-900 px-5 py-3 text-sm font-semibold text-white"
            href="https://github.com/ShaikArham/fireops-lab"
            target="_blank"
            rel="noopener noreferrer"
          >
            View code on GitHub ↗
          </a>
          <a
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900"
            href="https://shaikarham.github.io/arham-portfolio/assets/Shaik_Arham_Saquib.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            View CV ↗
          </a>
          <a
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900"
            href="https://shaikarham.github.io/arham-portfolio/assets/Shaik_Arham_Saquib.pdf?download=1"
            download="Shaik_Arham_CV.pdf"
          >
            Download CV ↓
          </a>
          <a
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900"
            href="https://shaikarham.github.io/arham-portfolio/"
            target="_blank"
            rel="noopener noreferrer"
          >
            My Portfolio ↗
          </a>
        </div>
      </section>
      <div className="flex flex-wrap justify-between gap-3 text-sm font-semibold">
        <a href="#intro" className="text-teal-800 hover:underline">
          ↑ Back to introduction
        </a>
        <a href="#thank-you" className="text-teal-800 hover:underline">
          Next: personal note ↓
        </a>
      </div>
      <section id="thank-you" className="about-section rounded-2xl bg-slate-100 p-6 md:p-9">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-800">A personal note</p>
        <h3 className="mt-3 text-2xl font-semibold">Thank you for exploring FireOPS.</h3>
        <p className="mt-3 max-w-3xl leading-7 text-slate-700">
          I would welcome a conversation about how my BI and application-operations background could
          contribute to fire.com. This project shows my thinking and willingness to learn, using
          fictional records only.
        </p>
        <p className="mt-5 font-semibold">Shaik Arham</p>
      </section>
      <AboutScrollNavigator />
    </div>
  );
}
