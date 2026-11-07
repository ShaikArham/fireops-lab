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
- [ ] Phase 7: metrics and exports reconcile with source records.
- [ ] Phase 8: mobile, accessibility, performance and recruiter journey pass.
- [ ] Phase 9: regression, security and release-blocker review pass.
- [ ] Phase 10: deployment, browser, downloads, video/captions (if included), CV evidence and public links pass.

## Release evidence record

| Field | Value |
|---|---|
| Date / timezone | 2026-11-07, Europe/Dublin |
| Verified implementation SHA | Phase 6 implementation: `27526f36fce55742d67cd1c73524002ba3ae1d56` (PR #12); docs follow-up commit recorded in PR history. |
| CI runs | Phase 6 [PR checks](https://github.com/ShaikArham/fireops-lab/actions/runs/42424710402) (PostgreSQL migration/schema, 84 backend tests, frontend checks, and Chromium E2E); Phase 5 [PR checks](https://github.com/ShaikArham/fireops-lab/actions/runs/42422701998). Phase 4 [PR checks](https://github.com/ShaikArham/fireops-lab/actions/runs/42419935544) and [post-merge `main`](https://github.com/ShaikArham/fireops-lab/actions/runs/42420031755); Pages publish [run](https://github.com/ShaikArham/fireops-lab/actions/runs/42420334086). Earlier phase evidence is recorded below. |
| Commands / results | Phase 6 local: Ruff; 84 backend tests; temporary SQLite migration and schema comparison; frontend format, lint, TypeScript, 2 Vitest tests, and static export passed. GitHub Actions run 42424710402 passed PostgreSQL migration/schema checks, all 84 backend tests, frontend checks, 2 Vitest tests, 7 Chromium E2E tests including the monitoring review journey, and static export. |
| Preview and production URLs | Static preview: https://shaikarham.github.io/fireops-lab/ · API/database and full production release not deployed. |
| Desktop/mobile/manual results | Phase 5 frontend case workflow passed in Chromium CI against a mocked API; backend persistence and rules passed API tests against SQLite and PostgreSQL CI. Public Pages remains a read-only Phase 4 demo; mobile QA remains in Phase 8. |
| Known P0/P1/P2/P3 issues | No open Phase 6 gate blocker. API/database hosting is intentionally pending; public Pages does not expose API-backed case management or monitoring. |

## Current evidence (2026-11-07)

- Phase 6 is **complete on its PR branch**: four explainable rules (high-value, payer velocity, repeated failures, duplicate reference), source evidence and possible benign explanations, idempotent runs, severity/status/rule filters, controlled human review, reasoned dismissal/escalation, notes and append-only activity history, and a simulated internal escalation summary. UI and API state clearly that an alert is not proof of fraud or money laundering and the summary is not a suspicious activity report or regulatory filing. Local Ruff and 84 backend tests passed; migration upgrade/schema check, frontend checks, two Vitest tests and static build passed. GitHub Actions [run 42424710402](https://github.com/ShaikArham/fireops-lab/actions/runs/42424710402) passed PostgreSQL migration/schema checks, all 84 backend tests, frontend checks, 2 unit tests, 7 Chromium E2E tests and static export. PR #12: https://github.com/ShaikArham/fireops-lab/pull/12. Awaiting merge and post-merge `main` verification.


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
- GitHub Pages was enabled with Actions as its source and manually published successfully in run `42420334086`. The live static page was opened in Chromium and the side-by-side evidence and read-only/API-not-hosted notice were confirmed. The API and database remain undeployed. Mobile/device QA is reserved for Phase 8.
- Local Playwright could not launch because this workspace has no installed Chromium executable. The five PR and post-merge Chromium tests ran successfully in GitHub Actions.

## Phase 3 verification (2026-11-07; gate passed)

- Implemented checksum-idempotent, all-or-nothing payment and settlement CSV imports; preview returns at most 25 records. Conflicting identifiers reject and roll back the whole import.
- Added the payment event table and Alembic migration `0002_payment_events`. Lifecycle transitions permit `CREATED -> VALIDATED -> PROCESSING -> SETTLED|FAILED`; transitions record actor, reason, correlation ID, and monotonically ordered UTC events.
- Added deterministic batch simulation, settlement source records, per-currency batch control totals, payment event history, and API-backed browser controls. Simulation does not transmit money.
- Local checks: Ruff passed; 68 backend tests passed, including the full 25-pair state transition matrix; Alembic upgrade and schema comparison passed against temporary SQLite; frontend formatting, lint, TypeScript, 2 Vitest tests, static export, and output-file check passed.
- Local Playwright could not launch a browser in this sandbox. Playwright's browser download returned a truncated archive, and the system Chromium process is blocked by the container. GitHub Actions verified the browser flows in the linked PR and post-merge runs above.
- At Phase 3 close, no deployment had happened. Before any public API deployment, Phase 9 must review public write isolation, rate limits, CORS origins, and demo reset behavior.

