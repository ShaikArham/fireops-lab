# Release checklist

This checklist is a living release record. Do not check an item until evidence exists.

## Phase gates

- [x] Phase 0: scope, architecture, requirement traceability, independence, cost and acceptance criteria reviewed.
- [ ] Phase 1: repository, clean-clone instructions, exact dependency locks, local skeleton, tests, CI and preview foundation verified.
- [ ] Phase 2: schema, migrations, reproducible synthetic data and validation pass.
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
| Branch / commit SHA | `main` / `165d31f5cb880b320a4426328261f5e400346a41` (foundation source) |
| CI run | [Run 1 passed](https://github.com/ShaikArham/fireops-lab/actions/runs/42412228377) on the foundation source commit |
| Commands / results | Frontend: Biome format/lint, TypeScript, Vitest (2 passed), static export build with GitHub Pages base path, and output-file check passed. Backend: `uv sync --frozen`, Ruff, pytest (1 passed). `npm audit --audit-level=high`: 0 vulnerabilities. `git diff --check` and secret-pattern scan passed. Local Playwright could not start because Chromium is absent in this environment. GitHub Actions installed Chromium and passed both browser E2E tests. |
| Preview and production URLs | Not deployed |
| Desktop/mobile/manual results | Not recorded |
| Known P0/P1/P2/P3 issues | Not recorded |

## Current evidence (2026-11-07)

- Phase 0 documents created: project brief, architecture/cost/acceptance criteria, requirement traceability, and decision log.
- Phase 1 local skeleton created and clean-cloned from local Git; phase is **in progress**, not complete.
- Frontend: Biome format check/lint, TypeScript check, Vitest (2 tests), static GitHub Pages export and output-file check passed locally; GitHub Actions passed the same checks plus both Chromium E2E tests.
- Backend: Ruff and pytest (1 test) passed; HTTPX2 avoids the Starlette test-client deprecation warning.
- Local Playwright E2E could not launch because the Chromium executable is not installed. Remote GitHub Actions installed Chromium and both page tests passed.
- The foundation is pushed to the public `main` branch. GitHub Actions run 1 passed on source commit `165d31f5cb880b320a4426328261f5e400346a41`.
- Free release target is GitHub Pages static export with the manual publishing workflow; publishing remains deferred to Phase 10. Local GitHub Pages base-path export passed.
- Docker is not installed in the current workspace. Phase 1 does not require a database to run the local skeleton; container smoke remains open if the Docker Compose path is introduced.

