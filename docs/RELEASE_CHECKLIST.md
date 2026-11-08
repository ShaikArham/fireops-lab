# Release checklist

This checklist is a living release record. Do not check an item until evidence exists.

## Phase gates

- [x] Phase 0: scope, architecture, requirement traceability, independence, cost and acceptance criteria reviewed.
- [x] Phase 1: repository, clean-clone instructions, exact dependency locks, local skeleton, tests, CI and static preview foundation verified.
- [x] Phase 2: schema, migrations, reproducible synthetic data and validation pass.
- [x] Phase 3: lifecycle and idempotent imports pass.
- [x] Phase 4: deterministic reconciliation scenarios and invariants pass.
- [x] Phase 5: investigation workflow and audit history pass.
- [x] Phase 6: monitoring and human-review controls pass.
- [x] Phase 7: run-scoped metrics, exception exposure by currency, analyst-selected root causes, saved-run history and CSV exports reconcile with source records and browser workflow.
- [x] Phase 8: 33 Playwright tests passed across Chromium, Firefox and WebKit; recruiter journey, six viewport widths, keyboard skip link, backend checks, build and static asset budgets passed in CI/local verification.
- [x] Phase 9: regression, security and release-blocker review pass. PR and post-merge CI passed; GitHub secret scanning shows no alerts.
- [ ] Phase 10: deployment, browser, downloads, video/captions (if included), CV evidence and public links pass.

## Release evidence record

| Field | Value |
|---|---|
| Date / timezone | 2026-11-08, Europe/Dublin |
| Verified implementation SHA | Phase 9 implementation: `48986c68edca884ff426ad083a16f2e3d61f4d1b` |
| CI runs | Phase 9 [PR checks](https://github.com/ShaikArham/fireops-lab/actions/runs/42432833019) and [post-merge `main`](https://github.com/ShaikArham/fireops-lab/actions/runs/42433028368) passed PostgreSQL migration/schema checks, backend tests, dependency and secret scans, frontend checks, 33 Chromium/Firefox/WebKit E2E tests and static build. Earlier phase evidence is recorded below. |
| Commands / results | Local Phase 9: Ruff, 94 backend tests, 92% total statement coverage, fresh temporary SQLite Alembic upgrade/schema check, frontend Biome format/lint, TypeScript, 2 Vitest tests, Next.js production build, static asset budgets, npm audit (0 vulnerabilities), pip-audit (no known vulnerabilities), and detect-secrets (0 findings after excluding the public checksum manifest). PR and post-merge GitHub Actions passed PostgreSQL migration/schema checks, backend tests, dependency and secret audits, frontend checks and 33 Playwright tests across Chromium, Firefox and WebKit. GitHub repository secret scanning showed 0 open and 0 closed alerts. |
| Preview and production URLs | Static preview: https://shaikarham.github.io/fireops-lab/ · API/database and full production release not deployed. |
| Desktop/mobile/manual results | Browser assertions passed at 320, 375, 390, 768, 1024 and 1366 CSS pixels, including no horizontal overflow and the mobile menu. The recruiter journey and API workflows passed across three browser engines. This is CI browser verification, not manual real-device testing. Public Pages still serves the earlier read-only demo. |
| Known P0/P1/P2/P3 issues | No known Phase 8 gate blocker. Lighthouse and manual real-device checks, final static publish and API/database release decisions remain for later gates. API/database hosting is intentionally pending; public Pages remains read-only. |

## Current evidence (2026-11-08)

- Phase 9 is **complete and merged into `main`** through PR [#16](https://github.com/ShaikArham/fireops-lab/pull/16) as `48986c68edca884ff426ad083a16f2e3d61f4d1b`. PR CI run [42432833019](https://github.com/ShaikArham/fireops-lab/actions/runs/42432833019) and post-merge `main` run [42433028368](https://github.com/ShaikArham/fireops-lab/actions/runs/42433028368) passed. The runs include PostgreSQL 17.11 migrations/schema checks, backend tests, npm/pip audits, the repository secret scan, frontend checks, the static build and all 33 Chromium/Firefox/WebKit E2E tests. Local checks recorded above include 94 backend tests, 92% statement coverage, a fresh SQLite migration/schema check and clean audits. GitHub secret scanning showed 0 open and 0 closed alerts. The API/database remain unhosted; shared anonymous writes, rate limiting and backup/reset operations must be reviewed before any future hosted API is exposed. Phase 10 remains pending.

- Phase 6 is **complete and merged into `main`** through PR #12 as `20229274ce98dddc6fd11e614dcec825a71c1bcc`. Post-merge CI run [42425109153](https://github.com/ShaikArham/fireops-lab/actions/runs/42425109153) passed PostgreSQL migration/schema checks, backend tests, frontend checks, unit tests, Chromium E2E and static export. Four explainable rules, review controls, source evidence, benign explanations and the mock escalation summary are in the API-backed workspace. Public Pages remains read-only.
- Phase 7 is **complete and merged into `main`** through PR #13 as `1be1a4c2622bba7a76cadf5d562cabd67274799e`. PR run [42426952469](https://github.com/ShaikArham/fireops-lab/actions/runs/42426952469) and post-merge run [42427034900](https://github.com/ShaikArham/fireops-lab/actions/runs/42427034900) passed. The API and UI report metrics from one saved run, retain analyst-selected resolution root causes in audit history, separate review exposure by currency, explain timing and age definitions, show distinct-input run history and export that same run to CSV. Local migration/schema checks, Ruff, 86 backend tests, frontend checks, two Vitest tests and production build passed. Chromium CI verified the browser journeys. Phase 8 is complete; Phase 9 is next.
- Phase 8 is **complete and merged into `main`** through PR #14 as `e76f8e736656c258f18568c4383f16e0af42e145`. PR run [42429583246](https://github.com/ShaikArham/fireops-lab/actions/runs/42429583246) and post-merge run [42429791513](https://github.com/ShaikArham/fireops-lab/actions/runs/42429791513) passed PostgreSQL migration/schema checks, backend tests, frontend checks, static build and all 33 Playwright tests across Chromium, Firefox and WebKit. The suite verifies the synthetic recruiter journey, six viewport widths, keyboard navigation, API-backed case/monitoring flows, and CSV download. Local format, lint, typecheck, 2 Vitest tests, production build and static budgets passed (43.6 KB HTML, 621.8 KB JavaScript, 20.5 KB CSS raw). The live Pages site was not changed. Lighthouse and manual real-device review remain for Phase 10. Phase 9 is next.

- Phase 0 documents created: project brief, architecture/cost/acceptance criteria, requirement traceability, and decision log.
- Phase 5 is **complete**: exception cases link to saved reconciliation results; the queue filters by status, owner and exception type; assignment, notes, review, escalation, resolution and justified reopening append actor-attributed, timestamped audit activities. Duplicate and matched-result cases are rejected, state transitions are controlled, and escalation/resolution/reopen require reasons. Local Ruff and 77 backend tests passed; migration upgrade/schema check passed; frontend lint, TypeScript, 2 Vitest tests and static export passed. Phase 5 PR checks passed with PostgreSQL 17.11 and 6 Chromium E2E tests, including the missing-settlement investigation journey. The public Pages preview remains read-only and does not host the API/database.
- Phase 1 is **complete**: the public GitHub repository contains the committed skeleton, dependency locks, CI, and a manual-only static Pages publishing workflow. Phase 1 does not publish or deploy the application.
- Phase 2 is **complete and merged into `main`** through PR #4: PostgreSQL schema and migration, bounded CSV validation, reproducible normal and exception-day fixtures, checksummed manifest, and data dictionary. No upload endpoint or file persistence was added.
- Backend Ruff and 34 pytest tests passed. Alembic upgrade and schema comparison passed with temporary SQLite locally and PostgreSQL 17.11 in GitHub Actions.
- Fixture regeneration matched committed CSV bytes and manifest. Normal day: 100 instructions and 100 settlements. Exception day: 1,250 instructions and 1,230 settlements, including 10 missing settlement references and 10 duplicate instruction candidates.
- [PR #4](https://github.com/ShaikArham/fireops-lab/pull/4) was merged as `4ada600895b702aff6509924dc93b713b07289c4`; post-merge CI passed PostgreSQL migration/schema checks, backend tests, frontend regression, both Chromium browser tests, and the GitHub Pages static export. The manual Pages publish workflow remains untriggered.
- Free release target is GitHub Pages static export with the manual publishing workflow. At the user's request, the read-only Phase 4 preview was published early; full product release remains a Phase 10 gate. Local GitHub Pages base-path export passed.
- Docker is not installed in the local workspace; the PostgreSQL service and migration were exercised in GitHub Actions.
- Phase 3 is **complete and merged into `main`** through PR #6 as `682dd09ce213003baab74fa6d6b26b5e9fc29e62`. The post-merge `main` run passed PostgreSQL migration/schema checks, all 68 backend tests, frontend checks, all 3 Chromium E2E tests, and the static Pages export. No deployment was triggered.
- Phase 4 is **complete and merged into `main`** through PR #8 as `861a24f6984b954e73763cf2ed19de385567cbfe`. Post-merge run `42420031755` passed PostgreSQL 17.11 migration/schema checks, Ruff, all 75 backend tests, frontend checks, all 5 Chromium E2E tests and static Pages export.
- Phase 4 added exact-reference matching and a controlled fallback accepted only for a mutual unique candidate with equal amount, currency and direction inside the date window. Runs preserve selected source batches, rules version, stable input hashes, classification totals and paginated source comparisons. Duplicate and ambiguous candidates are not force-matched.
- The updated exception-day fixture contains 1,250 instructions and 1,230 settlements. Tested results: 1,218 exact matches (including one documented unique fallback), 1 late match, 1 amount mismatch, 20 duplicate candidates, 10 unmatched instructions and 10 unmatched settlements.
- GitHub Pages was enabled with Actions as its source and manually published successfully in run `42420334086`. The live static page was opened in Chromium and the side-by-side evidence and read-only/API-not-hosted notice were confirmed. The API and database remain undeployed. Phase 8 later verified six viewport widths in CI; manual device review remains for Phase 10.
- Local Playwright could not launch because this workspace has no installed Chromium executable. The five PR and post-merge Chromium tests ran successfully in GitHub Actions.

## Phase 3 verification (2026-11-07; gate passed)

- Implemented checksum-idempotent, all-or-nothing payment and settlement CSV imports; preview returns at most 25 records. Conflicting identifiers reject and roll back the whole import.
- Added the payment event table and Alembic migration `0002_payment_events`. Lifecycle transitions permit `CREATED -> VALIDATED -> PROCESSING -> SETTLED|FAILED`; transitions record actor, reason, correlation ID, and monotonically ordered UTC events.
- Added deterministic batch simulation, settlement source records, per-currency batch control totals, payment event history, and API-backed browser controls. Simulation does not transmit money.
- Local checks: Ruff passed; 68 backend tests passed, including the full 25-pair state transition matrix; Alembic upgrade and schema comparison passed against temporary SQLite; frontend formatting, lint, TypeScript, 2 Vitest tests, static export, and output-file check passed.
- Local Playwright could not launch a browser in this sandbox. Playwright's browser download returned a truncated archive, and the system Chromium process is blocked by the container. GitHub Actions verified the browser flows in the linked PR and post-merge runs above.
- At Phase 3 close, no deployment had happened. Before any public API deployment, Phase 9 must review public write isolation, rate limits, CORS origins, and demo reset behavior.

