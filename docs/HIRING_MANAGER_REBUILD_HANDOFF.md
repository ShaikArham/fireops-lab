# FireOPS hiring-manager rebuild handoff

Updated: 2026-11-08

## Goal
Transform the independent fictional FireOPS payment operations portfolio from a long read-only landing page into a hiring-manager-ready interactive application for an Operations Analyst application. Video intentionally deferred until the end. Keep non-affiliation, fictional-data, no-real-money, and no-proven-fraud disclaimers.

## Verified starting point
- Production: https://fireops-lab.vercel.app (HTTP 200, Next.js frontend).
- Production main at 323ec7a7385eebae4283ddc0b354135be4020522 before rebuild.
- Production content currently includes static reconciliation, guided investigation, monitoring rules and sample insights.
- Production explicitly says the operations API is not connected. Backend functionality has NOT been verified in production.
- Existing repository includes frontend, backend, docs, synthetic fixtures, and automated testing infrastructure.

## Completed rebuild work
- Created branch feat/hiring-manager-workspace from main.
- Commit 440ae0b23044233ce3827471d7efb3ef5d368ef1: changed frontend/src/app/page.tsx to add a persistent desktop sidebar, mobile menu, wider content area, and payments anchor.
- Requested Vercel preview deployment dpl_FqDxwb8VxeAp8TvrZ5qLNNN9hc7D. Its build status must be checked before treating the UI as verified.
- Production intentionally not modified.

## Work pending, in priority order
1. Verify preview build, fix any TypeScript/build errors, and inspect rendered desktop/mobile navigation.
2. Replace one-page anchor navigation with real workspace routes/pages and active sidebar state.
3. Audit backend API and persistence, deploy it, configure environment variables and database safely.
4. Build real payment batch import, validation, lifecycle processing and reconciliation interactions.
5. Build linked exception cases, evidence review, notes, status, escalation and audit history.
6. Connect monitoring alerts, human dispositions, and calculated insights to persisted state.
7. Implement guided 60-second recruiter demo with isolated/resettable synthetic scenarios.
8. Audit accessibility, responsiveness, security, data correctness, tests, performance and role alignment.
9. Produce video only after application is release-ready; CV can be attached at the end.
10. Promote to production only after tests and user approval.

## Rules
- Never misrepresent synthetic transactions as real banking activity.
- Never claim AML compliance or fraud detection decisions.
- Do not present mocked buttons or hardcoded number swaps as a working backend.
- Keep a completed/pending ledger updated after every step.
- Do not overwrite the production deployment until release checks pass.
