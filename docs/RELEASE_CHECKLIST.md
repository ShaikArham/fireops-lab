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
| Branch / commit SHA | `main` / remote foundation commit pending |
| CI run | Pending first remote push |
| Commands / results | Frontend: Biome format/lint, TypeScript, Vitest (2 passed), static export build with GitHub Pages base path, and output-file check passed. Backend: `uv sync --frozen`, Ruff, pytest (1 passed). `npm audit --audit-level=high`: 0 vulnerabilities. `git diff --check` and secret-pattern scan passed. Playwright E2E was attempted but could not start because the Chromium executable is not installed in this environment; CI installs Chromium and remains the browser-test gate. |
| Preview and production URLs | Not deployed |
| Desktop/mobile/manual results | Not recorded |
| Known P0/P1/P2/P3 issues | Not recorded |

## Current evidence (2026-11-07)

- Phase 0 documents created: project brief, architecture/cost/acceptance criteria, requirement traceability, and decision log.
- Phase 1 local skeleton created and clean-cloned from local Git; phase is **in progress**, not complete.
- Frontend: Biome format check/lint, TypeScript check, Vitest (2 tests), and production build passed.
- Backend: Ruff and pytest (1 test) passed; HTTPX2 avoids the Starlette test-client deprecation warning.
- Playwright API health smoke passed. A Chromium page-render test was attempted, but the local browser process failed in this sandbox with an OS socket permission error. The app server also cannot be reached from the separate cloud browser. This is an environment limitation; browser verification remains open.
- The public repository exists and is empty; initial commit and remote CI are pending.
- Free release target is GitHub Pages static export with the manual publishing workflow; publishing remains deferred to Phase 10. Local GitHub Pages base-path export passed.
- Docker is not installed in the current workspace. Phase 1 does not require a database to run the local skeleton; container smoke remains open if the Docker Compose path is introduced.

