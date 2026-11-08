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
- Requested Vercel preview deployment dpl_FqDxwb8VxeAp8TvrZ5qLNNN9hc7D. Deployment READY and HTTP 200 verified at https://fireops-m8flx8bnn-shaikarhamsaquib1188113-7684.vercel.app. Desktop/mobile visual and interaction testing remains pending.
- Production intentionally not modified.

## Work pending, in priority order
1. Preview build and HTTP 200 verified. Still inspect rendered desktop/mobile navigation and resolve any UX defects.
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

## Backend audit discovery
- frontend/src/app/operations-workspace.tsx calls /api/v1 via NEXT_PUBLIC_API_BASE_URL and implements actual import/processing UI actions, but production currently lacks a configured backend URL.
- frontend/src/app/reconciliation-workspace.tsx contains a static preview fallback plus API-dependent run interactions.
- backend/pyproject.toml defines FastAPI, SQLAlchemy, PostgreSQL driver, Alembic and Python 3.12.
- Next step is to inspect API routes and deploy a properly isolated backend; do not imply the workflow works until tested.

## Latest iteration: builder identity and scroll treatment
- Commit 7d6527e: operations-first landing language and About the builder content, including authentic Hitachi/DCU experience and GitHub link. Vercel preview dpl_9xmX68zUBaLAVxRPnX8Nf2bh4ddY verified READY.
- Commits ff647b3 and 46af632: landing-flow builder introduction and CSS scroll-reveal with reduced-motion respect and fallback. Vercel preview dpl_6unNdpdvkvhFGwsKBt1xqShinJy9 requested; must verify READY/HTTP 200 and actual animation on devices.
- User requires after EVERY run: completed, pending, preview URL, deploy status, commit SHA, and next step. Update this handoff continuously.
- Keep app-first, not portfolio-first. Builder section must be discoverable on landing and sidebar, without presenting as official Fire product.

## Run 4: actual workspace routes
- Previous builder-animation deployment dpl_6unNdpdvkvhFGwsKBt1xqShinJy9 reached READY.
- Commit 22e01298: created frontend/src/app/workspace/[section]/page.tsx with routes overview, payments, reconciliation, investigations, monitoring, insights, about; persistent sidebar and mobile menu. Existing operations components reused.
- Commit 3a33a371: landing CTA now opens /workspace/overview.
- Requested deployment dpl_ECBJSRaXFHw7s9isrGSkxmdu9usS URL https://fireops-26jhq2fgr-shaikarhamsaquib1188113-7684.vercel.app; build and route HTTP checks pending.
- Note: investigation route currently embeds reconciliation with its case panel; dedicated queue not yet built. API still unconnected; do not claim full functionality.
- Next: verify deployment, check all seven routes, audit backend routes and DB requirements, connect API in an isolated test environment.
