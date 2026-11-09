# FireOps Lab project brief

> **Current release note (9 November 2026):** The public GitHub Pages reviewer edition is configured to build from `main` with `NEXT_PUBLIC_REVIEW_MODE=static`. Overview, Payments, Reconciliation, Investigations, Monitoring and Insights show an immediate, read-only showcase based on committed fictional reconciliation data. They do not start a private session or require the Render/Neon backend. The About/CV route and introduction film are separate assets. API-backed editing, case decisions and session isolation are development/optional interactive capabilities, **not guaranteed features of the public static edition**. Historical phase/branch evidence below remains a record of work at that time; do not interpret it as proof of the current live release. Verify the latest [Pages](https://github.com/ShaikArham/fireops-lab/actions/workflows/pages.yml), [CI](https://github.com/ShaikArham/fireops-lab/actions) and browser checks for the same commit before declaring a complete release.


**Owner:** Shaik Arham Saquib  
**Target opportunity:** Operations Analyst at Fire.com, Dublin  
**Status:** Phases 0–8 are complete. The expanded recruiter journey passed three-engine CI but has not been published; the current public static URL still serves the earlier read-only reconciliation preview. API/database hosting and final release remain pending.
**Data policy:** synthetic data only  
**Independence:** FireOps Lab is an independent portfolio project. It is not affiliated with, commissioned by, endorsed by, or connected to Fire Financial Services Limited.

## Purpose

Demonstrate analytical and operational thinking through a small, inspectable payment operations simulator. A recruiter should be able to understand its purpose in about 15 seconds and follow one exception investigation in under two minutes without signing in.

## Audience and main journey

Primary audience: an operations hiring manager or analyst reviewing the project. Secondary audiences: a recruiter on mobile and a developer inspecting the repository.

Planned journey: open overview -> select a fictional payment day -> review control totals -> open an exception -> compare payment and settlement evidence -> record a reasoned disposition -> review a rule-based alert -> export a fictional case summary.

## Scope

The planned MVP includes synthetic payment instruction intake and validation, lifecycle simulation, settlement imports, deterministic reconciliation, exception cases with audit history, three to five explainable monitoring rules, operational reporting, CSV input, and a fictional investigation summary export.

The MVP excludes live bank connections, payment initiation, real customer information, KYC, sanctions screening, real SAR filing, compliance certification, real-time fraud prediction, and automated fraud or AML determinations. These boundaries apply to the product, documentation, screenshots, CV, and video.

## Evidence-based positioning

The project applies adjacent experience from Hitachi enterprise BI: SQL/PLSQL, reporting, data validation and reconciliation, production monitoring, ETL discrepancy investigation, documentation, and stakeholder coordination. LedgerPoint contributes reviewed finance operations and reconciliation lessons. OpsResolve AI contributes structured triage and human-readable investigation summaries. None of these imply prior professional payment-fraud or AML investigation work.

## Product principles

1. Correct records and transparent calculations before visual polish.
2. Integer minor units for money and explicit currency/time handling.
3. Deterministic, versioned reconciliation and monitoring rules.
4. Every meaningful state change leaves an audit entry.
5. Alerts are potential indicators that require trained human review.
6. Public demo records are read-only or isolated per visitor.
7. Every public page states that the scenario and data are fictional.

