"use client";

import { useEffect } from "react";
import Link from "next/link";

const sections = [
  {
    title: "Data Analyst · Hitachi Digital Services",
    dates: "Mar 2024 – Jul 2025",
    bullets: [
      "Monitored Oracle ODI workflows, ETL jobs and enterprise reporting processes.",
      "Investigated production incidents and reporting discrepancies with SQL and PL/SQL.",
      "Supported month-end data validation, reconciliation and issue resolution.",
      "Improved recurring reporting processes, reducing manual reporting effort by approximately 25%.",
      "Received the Hitachi Pinnacle Award for execution excellence and collaboration.",
    ],
  },
  {
    title: "ERP & Business Intelligence Analyst · Hitachi Digital Services",
    dates: "Feb 2023 – Mar 2024",
    bullets: [
      "Supported Oracle ERP/EBS R12 and business intelligence reporting environments.",
      "Validated data integrity, reconciled enterprise datasets and investigated failed jobs.",
      "Assisted with application testing, troubleshooting, documentation and corrective action.",
    ],
  },
  {
    title: "Security & Reception Officer · SOS Group",
    dates: "May 2026 – Present",
    bullets: [
      "Coordinate corporate reception, visitor registration, access control and administrative requests.",
      "Maintain operational logs and incident reports and coordinate with facilities and IT.",
    ],
  },
];
export default function CVPage() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("print")) {
      const handle = window.setTimeout(() => window.print(), 500);
      return () => window.clearTimeout(handle);
    }
  }, []);
  return (
    <main className="mx-auto max-w-4xl bg-white px-6 py-10 text-slate-900 print:max-w-none print:p-0">
      <div className="mb-8 flex flex-wrap gap-3 print:hidden">
        <Link href="/workspace/about" className="rounded-lg border border-slate-300 px-4 py-2">
          ← About
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-teal-800 px-4 py-2 font-semibold text-white"
        >
          Save or print CV as PDF
        </button>
      </div>
      <header className="border-b border-slate-300 pb-5">
        <h1 className="text-3xl font-bold">SHAIK ARHAM SAQUIB</h1>
        <p className="mt-2 text-sm">Dublin, Ireland · sarhamsaquib@gmail.com</p>
      </header>
      <section className="mt-6">
        <h2 className="text-lg font-bold uppercase text-teal-800">Professional Summary</h2>
        <p className="mt-2 leading-7">
          Business Intelligence and Data Analytics professional with 2.5+ years of experience at
          Hitachi Digital Services in SQL-based reconciliation, production incident investigation,
          ETL monitoring and operational reporting. MSc Computing (Data Analytics) graduate from
          Dublin City University and creator of FireOPS Lab, an independent payment operations
          simulation.
        </p>
      </section>
      <section className="mt-6">
        <h2 className="text-lg font-bold uppercase text-teal-800">Key Skills</h2>
        <p className="mt-2 leading-7">
          SQL · PL/SQL · Python · Advanced Excel · Data Reconciliation · Exception Investigation ·
          Root Cause Analysis · Oracle BI (OBIEE/OBIA) · Oracle Data Integrator · Oracle ERP/EBS R12
          · Power BI · Tableau · ETL Monitoring · Operational Reporting · Incident Management
        </p>
      </section>
      <section className="mt-6">
        <h2 className="text-lg font-bold uppercase text-teal-800">Professional Experience</h2>
        {sections.map((item) => (
          <article key={item.title} className="mt-4 break-inside-avoid">
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-bold">{item.title}</h3>
              <span className="text-sm">{item.dates}</span>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm leading-6">
              {item.bullets.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <section className="mt-6">
        <h2 className="text-lg font-bold uppercase text-teal-800">Projects</h2>
        <p className="mt-2">
          <strong>FireOPS Lab:</strong> Independent payment operations and reconciliation simulation
          built with Python, FastAPI, PostgreSQL and Next.js, covering exception investigation, case
          management, monitoring and reporting with fictional data.
        </p>
        <p className="mt-2">
          <strong>OpsResolve AI:</strong> AI-assisted enterprise support platform demonstrating
          incident tracking, SLA risk and SOP recommendations.
        </p>
        <p className="mt-2">
          <strong>XAI-Enhanced LLM Energy Scheduling:</strong> MSc practicum integrating XGBoost and
          SHAP-based explanations.
        </p>
      </section>
      <section className="mt-6">
        <h2 className="text-lg font-bold uppercase text-teal-800">Education</h2>
        <p className="mt-2">
          MSc Computing (Data Analytics), Dublin City University · Sep 2025 – Aug 2026
        </p>
        <p>B.Tech Computer Science Engineering, CMR Institute of Technology · 2019 – 2023</p>
      </section>
      <p className="mt-8 text-xs text-slate-500 print:hidden">
        This web CV is a concise summary of the updated PDF supplied for the FireOPS application.
        Use the original PDF for the complete version.
      </p>
    </main>
  );
}
