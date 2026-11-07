# FireOps Lab project brief

**Owner:** Shaik Arham Saquib  
**Target opportunity:** Fire Operations Analyst, Dublin  
**Status:** Phases 0–2 are complete; Phase 3 payment lifecycle work has not started
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

