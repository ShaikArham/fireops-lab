# Hiring-manager workspace release gate

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
