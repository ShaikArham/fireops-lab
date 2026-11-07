# Release checklist

This checklist is a living release record. Do not check an item until evidence exists.

## Phase gates

- [x] Phase 0: scope, architecture, requirement traceability, independence, cost and acceptance criteria reviewed.
- [x] Phase 1: repository, clean-clone instructions, exact dependency locks, local skeleton, tests, CI and static preview foundation verified.
- [x] Phase 2: schema, migrations, reproducible synthetic data and validation pass.
- [ ] Phase 3: lifecycle and idempotent imports pass.
- [ ] Phase 4: deterministic reconciliation scenarios and invariants pass.
- [ ] Phase 5: investigation workflow and audit history pass.
- [ ] Phase 6: monitoring and human-review controls pass.
- [ ] Phase 7: metrics and exports reconcile with source records.
- [ ] Phase 8: mobile, accessibility, performance and recruiter journey pass.
- [ ] Phase 9: regression, security and release-blocker review pass.
- [ ] Phase 10: deployment, browser, downloads, video/captions (if included), CV evidence and public links pass.

## Release evidence record

| Field | Value |
|---|---|
| Date / timezone | 2026-11-07, Europe/London |
| Verified implementation SHA | `788c27b38f65d1b0353075c06a9c3bcb3971071a` (Phase 2 pull request) |
| CI runs | [Pull request checks passed](https://github.com/ShaikArham/fireops-lab/actions/runs/42414321907); [post-merge `main` checks passed](https://github.com/ShaikArham/fireops-lab/actions/runs/42414607903) |
| Commands / results | Phase 2: `uv sync --frozen`, Ruff, 34 pytest tests, temporary SQLite migration and `alembic check` passed locally. GitHub Actions applied the migration to PostgreSQL 17.11, found no schema drift, and passed the backend suite. Fixture regeneration matched committed CSV bytes and manifest checksums. Frontend regression, both Chromium E2E tests, static Pages export, and output-file check passed. |
| Preview and production URLs | Not deployed |
| Desktop/mobile/manual results | Not recorded |
| Known P0/P1/P2/P3 issues | Not recorded |

## Current evidence (2026-11-07)

- Phase 0 documents created: project brief, architecture/cost/acceptance criteria, requirement traceability, and decision log.
- Phase 1 is **complete**: the public GitHub repository contains the committed skeleton, dependency locks, CI, and a manual-only static Pages publishing workflow. Phase 1 does not publish or deploy the application.
- Phase 2 is **complete and merged into `main`** through PR #4: PostgreSQL schema and migration, bounded CSV validation, reproducible normal and exception-day fixtures, checksummed manifest, and data dictionary. No upload endpoint or file persistence was added.
- Backend Ruff and 34 pytest tests passed. Alembic upgrade and schema comparison passed with temporary SQLite locally and PostgreSQL 17.11 in GitHub Actions.
- Fixture regeneration matched committed CSV bytes and manifest. Normal day: 100 instructions and 100 settlements. Exception day: 1,250 instructions and 1,230 settlements, including 10 missing settlement references and 10 duplicate instruction candidates.
- [PR #4](https://github.com/ShaikArham/fireops-lab/pull/4) was merged as `4ada600895b702aff6509924dc93b713b07289c4`; post-merge CI passed PostgreSQL migration/schema checks, backend tests, frontend regression, both Chromium browser tests, and the GitHub Pages static export. The manual Pages publish workflow remains untriggered.
- Free release target is GitHub Pages static export with the manual publishing workflow; publishing remains deferred to Phase 10. Local GitHub Pages base-path export passed.
- Docker is not installed in the local workspace; the PostgreSQL service and migration were exercised in GitHub Actions.

## Phase 3 candidate evidence (2026-11-08; gate remains open pending GitHub CI)

- Implemented checksum-idempotent, all-or-nothing payment and settlement CSV imports; preview returns at most 25 records. Conflicting identifiers reject and roll back the whole import.
- Added the payment event table and Alembic migration `0002_payment_events`. Lifecycle transitions permit `CREATED -> VALIDATED -> PROCESSING -> SETTLED|FAILED`; transitions record actor, reason, correlation ID, and monotonically ordered UTC events.
- Added deterministic batch simulation, settlement source records, per-currency batch control totals, payment event history, and API-backed browser controls. Simulation does not transmit money.
- Local checks: Ruff passed; 68 backend tests passed, including the full 25-pair state transition matrix; Alembic upgrade and schema comparison passed against temporary SQLite; frontend formatting, lint, TypeScript, 2 Vitest tests, static export, and output-file check passed.
- Local Playwright could not launch a browser in this sandbox. Playwright's browser download returned a truncated archive, and the system Chromium process is blocked by the container. The new browser workflow must pass GitHub Actions before Phase 3 can be checked.
- No deployment has happened. Before any public API deployment, Phase 9 must review public write isolation, rate limits, CORS origins, and demo reset behavior.
- Phase 3 is **not yet complete**. PostgreSQL 17 CI, GitHub Actions browser tests, a clean main-branch merge, and post-merge verification are still required.

