# Hiring-manager workspace release gate

> **Current release note (9 November 2026):** The public GitHub Pages reviewer edition is configured to build from `main` with `NEXT_PUBLIC_REVIEW_MODE=static`. Overview, Payments, Reconciliation, Investigations, Monitoring and Insights show an immediate, read-only showcase based on committed fictional reconciliation data. They do not start a private session or require the Render/Neon backend. The About/CV route and introduction film are separate assets. API-backed editing, case decisions and session isolation are development/optional interactive capabilities, **not guaranteed features of the public static edition**. Historical phase/branch evidence below remains a record of work at that time; do not interpret it as proof of the current live release. Verify the latest [Pages](https://github.com/ShaikArham/fireops-lab/actions/workflows/pages.yml), [CI](https://github.com/ShaikArham/fireops-lab/actions) and browser checks for the same commit before declaring a complete release.


Branch: `feat/hiring-manager-workspace`

## Verification policy

A successful formatting workflow does not mean the branch is release-ready. Record the exact commit SHA for each passing CI, browser, API, and deployment check. Do not mark an item complete from a previous commit's results.

## Critical connected-experience acceptance tests

- [ ] New browser: create isolated demo session, load two synthetic scenarios, reload, and retain the same session.
- [ ] Returning browser: preserve existing case decisions and records; seed missing datasets without duplicating records.
- [ ] Scenario selector: both scenarios persist across all workspace routes, with matching batch-specific data in each section.
- [ ] Reconciliation: selected scenario has a saved, correct, reproducible run.
- [ ] Investigations: exceptions have actionable cases before navigation, with matching evidence and no duplicate cases.
- [ ] Monitoring: alert queue comes from the selected batch and real saved monitoring run.
- [ ] Insights: metrics and export use the selected saved reconciliation run, not unrelated latest runs.
- [ ] Case decisions: assignment, note, escalation and resolution refresh dependent metrics and queue views.

## Hiring-manager acceptance tests

- [ ] One coherent navigation model across landing and workspace.
- [ ] Overview shows real backend-derived KPIs and a clear next step.
- [ ] Payment records open their saved lifecycle evidence.
- [ ] Reconciliation explains differences, currency, timing, and classification.
- [ ] Investigation panel prioritizes evidence, decision and audit history.
- [ ] All routes provide clear loading, empty, error and retry states.
- [ ] Mobile and desktop chapter navigation has no traps or layout shifts.
- [x] Approved About & Application content not intentionally edited during this phase.

## Visual/accessibility and engineering

- [ ] Unified typography, spacing, buttons, status badges and panels.
- [ ] Monitoring/Insights remain readable without excess visual density.
- [ ] Check 320, 375, 390, 768, 1024 and 1366 CSS pixel widths.
- [ ] Keyboard, focus, reduced motion, chart descriptions and animation responsiveness checked.
- [ ] Exact release SHA passes formatting, lint, typecheck, frontend build, backend tests and all Playwright browsers.
- [ ] Verify proxy, cookies, isolated sessions, security, dependency scans and asset budgets.
- [ ] Verify deployed preview and real devices before production promotion.

**Deployment rule:** Do not promote to production or claim completion until the exact release SHA has evidence for every release-blocking check.
