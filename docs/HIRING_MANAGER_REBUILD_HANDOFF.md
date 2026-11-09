# FireOPS hiring-manager rebuild handoff

> **Current release note (9 November 2026):** The public GitHub Pages reviewer edition is configured to build from `main` with `NEXT_PUBLIC_REVIEW_MODE=static`. Overview, Payments, Reconciliation, Investigations, Monitoring and Insights show an immediate, read-only showcase based on committed fictional reconciliation data. They do not start a private session or require the Render/Neon backend. The About/CV route and introduction film are separate assets. API-backed editing, case decisions and session isolation are development/optional interactive capabilities, **not guaranteed features of the public static edition**. Historical phase/branch evidence below remains a record of work at that time; do not interpret it as proof of the current live release. Verify the latest [Pages](https://github.com/ShaikArham/fireops-lab/actions/workflows/pages.yml), [CI](https://github.com/ShaikArham/fireops-lab/actions) and browser checks for the same commit before declaring a complete release.


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

## Run 5: verification and backend security blocker
- Vercel deployment dpl_ECBJSRaXFHw7s9isrGSkxmdu9usS reached READY.
- All seven /workspace/{overview,payments,reconciliation,investigations,monitoring,insights,about} returned HTTP 200.
- backend/app/main.py middleware BLOCKS ALL POST/PUT/PATCH/DELETE /api/v1 requests unless FIREOPS_ENV=development AND FIREOPS_ENABLE_DEMO_WRITES=true. This is an intentional safety control. Never bypass by setting a public deployment to development without proper isolation/authentication.
- Backend deployment requires isolated persistent DB, scoped writes/session isolation, abuse limits, CORS allowlist and security review before enabling public interaction.
- Commit 937bd1a: investigations route now uses CaseWorkspace as dedicated queue instead of embedding entire reconciliation workspace. The queue is backend-dependent; it is not functional in deployed preview without API.
- Browser interaction and real-device mobile tests remain unverified. Route HTTP 200 is not a browser E2E test.
- Additional priority audit tasks: ensure no public writable shared database; import size limits and CSV formula injection checks; deterministic idempotency; currency minor-unit accuracy; mismatch denominators; pagination for cases; API error handling; loading/empty states; accessible navigation and reduced motion; route-aware active state; performance budget; Playwright desktop/mobile smoke tests; resettable synthetic demo; audit event integrity; no false AML claims; CV links only when provided.

## Run 6: verification and deployment blockers
- dpl_4WDBvHMtWgHkMUZGCr5SHcz9hqS4 READY; /workspace/investigations HTTP 200.
- Vercel project environment variable metadata inspection returned envs=[]; no configured API base URL or database connection available for frontend deployment.
- Therefore FastAPI + PostgreSQL public integration and persistent downstream metrics cannot truthfully be marked complete. Backend intentionally blocks nonlocal writes (see Run 5). Need isolated database, API deployment and safe write/session strategy before integration.
- Commit d3e372c adds frontend/e2e/workspace-navigation.spec.ts covering seven route renders, desktop navigation, mobile navigation/overflow, About disclosures. Tests are authored but have NOT yet run in browser; do not claim E2E pass.
- Browser route GET checks are not a substitute for full interaction testing.

## Run 7: operational connection transparency
- Prior Vercel deployment dpl_5cteQSwQX2jWKpPjJUzXmvznX8Nd READY.
- Commit cb125565 adds API health status client component; commit dedb608 integrates status on every workspace. Status checks /health when NEXT_PUBLIC_API_BASE_URL exists, and explicitly says unconfigured/sample views otherwise. Health online does NOT prove writes or DB persistence.
- API/database integration, downstream metrics, and browser E2E still pending; do not mark complete.
- Next: secure isolated backend deployment and DB provisioning, then actual integration tests.

## Run 8: executable browser CI
- Previous preview dpl_85e9344HsrsWXoAmk5AVcEWokK7V READY.
- Commit 492c908: added .github/workflows/workspace-browser.yml, automatically runs npm ci, TypeScript typecheck and Chromium Playwright workspace navigation tests on development-branch pushes; uploads failure artifacts.
- GitHub connector fetch_commit_workflow_runs only returns PR-triggered runs, so an empty result does NOT prove workflow failed or passed. Browser CI result remains unverified.
- Vercel integration configurations list is empty and Vercel env list empty; no managed Postgres integration is currently attached. Cannot safely enable backend writes or claim persistent end-to-end operations.

## Run 9: live metrics refresh wiring
- Previous preview dpl_AuM5ns1PrRC1vyzWhdNa3VBsEbYy READY.
- Commits 9fd56a5 and a0a4e7e: Insights refreshes on window focus, explicit Refresh live metrics button and fireops:operations-updated event. Operations emits that event after successful import and simulation.
- This only refreshes persisted metrics when the API is configured and operational. It does not create a database or a public backend.
- Need user-approved Postgres integration or existing database URL in secret environment; no credentials in repo or chat. Public writes must be isolated and controlled.

## Run 10: resumed after Work limit, database and backend provisioning
- Latest Work commit fdb458bc466bfe26c755c119289795ab01c8452e adds isolated PostgreSQL demo sessions and audit fixes. Work reported 94 backend and five frontend unit tests passing and four isolation tests passing; independently verify CI.
- Neon project fireops-isolated-demo id lingering-darkness-61534639 created in aws-eu-west-2. Created public.fireops_demo_sessions registry table with quoted "window" identifier. Do not commit or print DB credentials.
- New Vercel frontend project fireops-workspace-preview id prj_Ncx7uDrIfQahDrnWrPIH6py2eeWl corrected to rootDirectory=frontend, framework=nextjs, Node 24. Deployment dpl_8b8WaRxZwhhL33zcjS7A3NUQ7wav READY at https://fireops-workspace-preview-oor8ld5au.vercel.app (not yet end-to-end verified).
- Backend Vercel project fireops-demo-api id prj_R2g9QxCwmtiuvuv0X6ED8DiZZtOx, rootDirectory=backend, framework=fastapi. Added backend/api/index.py and backend/requirements.txt (commits c6a0038, 63933f7). Configured DATABASE_URL encrypted in preview, FIREOPS_ISOLATED_DEMO=true, FIREOPS_ENV=production. Backend deployment dpl_DwFaabNZu5PxarQJLYkV2gQhvy47 BUILDING at last check; health unverified.
- Backend Vercel deployment protection enabled. Frontend is not yet connected to backend; same-origin proxy/cookie routing and secure API public-origin/CORS require review. Do not remove protection until security and E2E tests pass.
- Original production site untouched.

## Run 11: Investigations 404 diagnosis and integration
- Confirmed backend dpl_DwFaabNZu5PxarQJLYkV2gQhvy47 READY /health 200, but /api/v1/cases returned 503 database unconfigured. Root cause: deployment target production while DB env vars were preview-only.
- Added DATABASE_URL encrypted and FIREOPS_ISOLATED_DEMO=true/FIREOPS_ENV=production for the separate backend project production target (does not promote existing FireOPS frontend). Added FIREOPS_PUBLIC_ORIGIN restricted to the frontend branch alias.
- Frontend preview project env FIREOPS_API_PROXY set to https://fireops-demo-api.vercel.app and NEXT_PUBLIC_API_BASE_URL=/backend; frontend next.config.mjs already has rewrite /backend/:path* to backend.
- Added frontend/src/app/demo-session-controls.tsx with Start demo, Load sample data and Reset my demo; wired into all workspace routes (commits 029bff2, 3b2a555). This allows session creation before case queue, but UI/actual flow not yet verified.
- New backend project SSO protection disabled for public API (the app's session token and per-visitor isolation remain the access boundary). Backend redeployment dpl_6qAZMsvkM7pvAS5tccvLEyx763FE QUEUED at last check; frontend dpl_HHhwEUtcqEU5JeFCQspwWdMxNcou BUILDING.
- Critical: latest frontend proxy env update and backend origin env update require NEW redeployments after their respective deployments finish. Verify actual deployment env target, stable aliases, session cookie forwarding, API status, 404 removal, database persistence, two-visitor isolation and desktop/mobile E2E before marking complete. Current E2E not verified.

## Run 12: screenshot-driven cross-origin, About and navigation fixes
- User screenshots showed duplicate demo control panels and 403 Cross-origin demo writes are not allowed.
- Root cause: preview deployments change hostname, backend compared Origin to a single FIREOPS_PUBLIC_ORIGIN. Backend now accepts explicit origins plus exact project-specific Vercel preview hostname pattern; rejects other domains and sec-fetch-site=cross-site. Security test added for trusted and malicious hostnames. Regex corrected in commit fb735e3.
- Removed duplicate ApiConnectionStatus from workspace page; DemoSessionControls is now the only load/reset UI and is hidden on About.
- About now links directly to official role https://www.fire.com/careers/operations-analyst/ and selected portfolio showcase https://ledgerpoint-ai.vercel.app/#portfolio, with sticky section navigation and native anchors (#intro, #approach, #strengths, #background, #projects, #application, #thank-you), reduced-motion-aware smooth scrolling.
- New backend deployment dpl_FgeGRgbFhNwsX9jq4RKr2UhhTbCx and frontend dpl_5atzZyDGHBRfaCXcKS4Zy3KMZ3GQ queued at last check. Do not claim live success until POST /backend/api/v1/demo/session and /load in real browser, verify cookie persistence and reset isolation.
- Original production remains unchanged; CV still awaiting user's verified asset.

## Run 13: scroll-led journey and built-in demo data
- User requested no LedgerPoint promotion/link in FireOPS. Removed the Explore LedgerPoint link and mention from frontend/src/app/about-builder.tsx. Kept official personal portfolio https://shaikarham.github.io/arham-portfolio/.
- Added frontend/src/app/journey-navigation.tsx, mounted on every workspace route: Overview -> Payments -> Reconciliation -> Investigations -> Monitoring -> Insights -> About. On desktop, scrolling further at bottom (wheel threshold) navigates forward, scrolling upward at top navigates back. Mobile swipe gestures and accessible Next/Previous links included. Do not hijack mid-page scrolling.
- Replaced frontend/src/app/demo-session-controls.tsx manual sample loader with first-visit automatic isolated-session creation + POST /demo/load of built-in fictional fixtures; existing visitor data is preserved. Refresh records remains available. A sessionStorage retry guard prevents repeated failing writes; successful initialization reloads once so all workspace views re-fetch.
- Latest code commit fe036ff9d65e6cbb931267bf44eeaa4cdd72a7aa; latest deployed frontend remains dpl_5atzZyDGHBRfaCXcKS4Zy3KMZ3GQ at commit b0f5011e769f84413dd6a15f8a34e87e9dbd1009, NOT the latest changes.
- Deployment creation was blocked by Vercel HTTP 402 api-deployments-free-per-day. Wait for quota reset or user-approved billing action; do not imply live deployment or QA pass.
- Next verify frontend build, first-visit auto seed, persistence across route scroll, no duplicate seeding, two-visitor isolation, mobile scroll navigation and accessible next links. No production promotion.
