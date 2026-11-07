# FireOps Lab project handoff

**Updated:** 2026-11-07 (Europe/Dublin)  
**Owner:** Shaik Arham Saquib  
**Repository:** [ShaikArham/fireops-lab](https://github.com/ShaikArham/fireops-lab)  
**Current public static preview:** [https://shaikarham.github.io/fireops-lab/](https://shaikarham.github.io/fireops-lab/)  
**Phase 7 verified merge:** `1be1a4c2622bba7a76cadf5d562cabd67274799e` (PR #13; PR run 42426952469 and post-merge CI run 42427034900 passed). **Current work:** Phase 8, mobile, accessibility, performance and recruiter journey.

This file is the resume point for a new chat. Treat the repository's current `main` branch and passing CI evidence as authoritative. The workspace used in the previous chat may not persist and contained local changes; start from a fresh clone or fetch `main` before continuing.

## Project rules

- Work one master-blueprint phase at a time. Do not start a later phase before the current phase's completion gate passes.
- Use fictional records only. Never connect to a bank or payment network or imply affiliation with Fire Financial Services Limited.
- Keep the project completely free to build and operate. Verify any hosting or tool limits before choosing them. Do not add paid services or require subscriptions.
- Use explainable operational rules and human review. Do not add AI as decoration or make unsupported fraud/AML claims.
- Do not invent features, test results, performance claims or completion status. Keep the release checklist current.
- Do not call the project 100% complete until the final deployed application, core journeys, video and downloads have been tested in a real browser.

## Completed phases

| Phase | State | Evidence |
|---|---|---|
| 0 · scope and plan | Complete | Project brief, architecture and cost decisions, acceptance criteria, traceability and decision log are in `docs/`. |
| 1 · repository foundation | Complete | Exact frontend and backend locks, GitHub Actions CI, clean-clone documentation and manual GitHub Pages workflow. |
| 2 · data model and fixtures | Complete | PostgreSQL schema/migration, validation, reproducible synthetic fixtures, manifest and data dictionary. |
| 3 · payment lifecycle | Complete | Atomic/idempotent CSV imports, validated previews, lifecycle transitions/events, settlement simulation and batch controls. |
| 4 · reconciliation | Complete | Versioned deterministic engine, saved runs and results, source hashes, side-by-side comparison, expected exception cases and read-only Pages preview. |
| 5 · investigation cases | Complete | Exception queue and source evidence, assignment, analyst notes, controlled statuses, escalation, resolution, justified reopen, and case activity audit trail. Backend and migration tests plus Chromium case journey passed. |

| 6 · monitoring and human review | Complete | Four deterministic rules, evidence and benign explanations, reasoned human disposition, append-only review history, and simulated escalation summary. PR #12 and post-merge CI passed. |
| 7 · reporting and operational insights | Complete | Run-scoped metrics, same-run CSV export, analyst-selected root-cause audit history, case timing/ageing, currency-separated review exposure and distinct-input run history. PR #13 and post-merge CI passed. |

Eight of eleven phase gates (0–10) are complete (about 73% by gate count only, not a weighted estimate of all deliverables). Phase 8 is active; Phases 9–10 remain pending.

## Phase 4 details and verified evidence

- Exact-reference matches require equal currency, direction and integer minor-unit amount. The three-day default date window and controlled fallback are explainable.
- The fallback is accepted only for one mutual unique candidate with equal amount, currency and direction inside the date window. Duplicate and ambiguous candidates are not force-matched.
- Reconciliation requires explicit payment and settlement batch selections. Runs persist the rule version, stable input hashes, classification totals, signed differences grouped by currency and source-linked results. The read API supports pagination.
- The exception-day fixture has 1,250 instructions and 1,230 settlement records. Expected classifications: 1,218 `MATCHED_EXACT` (including one unique fallback), 1 `MATCHED_LATE`, 1 `AMOUNT_MISMATCH`, 20 `DUPLICATE_CANDIDATE`, 10 `UNMATCHED_INSTRUCTION`, 10 `UNMATCHED_SETTLEMENT` (1,260 results total).
- Local verification: Ruff; 75 backend tests; Alembic upgrade and schema check using temporary SQLite; frontend format, lint, type check, 2 Vitest tests and GitHub Pages static export passed.
- GitHub verification: Phase 4 PR run [42419935544](https://github.com/ShaikArham/fireops-lab/actions/runs/42419935544), Phase 4 post-merge run [42420031755](https://github.com/ShaikArham/fireops-lab/actions/runs/42420031755), including PostgreSQL 17.11 migration/schema checks and all 5 Chromium E2E tests.
- The manual Pages workflow succeeded in [run 42420334086](https://github.com/ShaikArham/fireops-lab/actions/runs/42420334086). GitHub Pages was enabled with Actions as its source. The live page was opened in Chromium; the side-by-side mismatch, late, missing-reference, duplicate and unique-fallback samples plus the read-only/API-not-hosted notice were observed.
- Mobile viewport/manual QA remains for Phase 8. Local Playwright could not launch because Chromium is not installed in the workspace; CI browser tests passed.
- The frontend is hosted as static files only. The FastAPI service and database are **not** deployed. API-backed operations work only with a configured backend. Do not imply the public preview has live persistence.
- Phase 5 PR [CI run 42422701998](https://github.com/ShaikArham/fireops-lab/actions/runs/42422701998) passed PostgreSQL migrations/schema checks, backend tests, static build and all 6 Chromium E2E tests. The missing-settlement browser journey covered case creation, assignment, an evidence note, review, resolution and audit history. The browser test uses a mocked HTTP API; backend persistence is verified separately through the API tests.

## Phase 7 close evidence

Phase 7 is complete. PR [#13](https://github.com/ShaikArham/fireops-lab/pull/13) merged as `1be1a4c2622bba7a76cadf5d562cabd67274799e`. PR CI [42426952469](https://github.com/ShaikArham/fireops-lab/actions/runs/42426952469) and post-merge `main` CI [42427034900](https://github.com/ShaikArham/fireops-lab/actions/runs/42427034900) passed. Local SQLite migration/schema check, Ruff, 86 backend tests, frontend formatting/lint/typecheck, two Vitest tests and production build also passed. The Chromium suite covered operational insights and the exported run-specific CSV.

## Current work: Phase 8

Review the mobile experience, keyboard access, semantic structure, color contrast and reduced-motion behavior. Check static-page performance with documented Lighthouse evidence where available, then refine the application journey so a recruiter can quickly understand the operations problem, inspect a reconciliation exception, follow its investigation and see report definitions. Preserve the free GitHub Pages deployment path and explain that the public site is read-only while the API/database are not hosted.

Do not start Phase 9 until Phase 8 mobile, accessibility, performance and recruiter-journey acceptance checks are recorded and pass.

## Later phases still pending

- **Phase 8:** mobile and accessibility review, performance checks and a clear recruiter journey.
- **Phase 9:** regression, security and release-blocker review, including CORS, public write isolation, rate limits and reset behavior before exposing an API.
- **Phase 10:** final free deployment decision and full browser verification; the 60–90 second introduction video (MP4, WebP thumbnail, VTT and transcript); one-page case study; Fire-specific two-page ATS CV; short application answers and follow-up message. Test the complete product and every download before calling the project 100% complete.

## User-provided video reference

The user asked to save [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar/tree/main). It is recorded in [`docs/REFERENCE_PROJECTS.md`](REFERENCE_PROJECTS.md) as a possible code-based visual/motion reference for the video, not as payment-operations requirements. Review styles and asset-level licensing before adapting anything. No code or assets have been copied.

## Repository map

- `backend/app/models/`, `schemas/`, `services/`, `api.py`: database records, validation schemas, business rules and HTTP routes.
- `backend/alembic/`: versioned database schema changes.
- `backend/tests/`: backend, migration, fixture and API tests.
- `data/synthetic/`: reproducible fictional CSV fixtures and checksummed manifest.
- `frontend/src/app/`: Next.js pages and operations/reconciliation UI; `phase4-preview.json` is generated from the same reconciliation engine.
- `frontend/e2e/`: Playwright browser journeys.
- `docs/`: architecture, requirements, scenarios, testing and release evidence.
- `docs/RELEASE_CHECKLIST.md`: phase gate source of truth; update only after evidence exists.
- `docs/REFERENCE_PROJECTS.md`: user-provided Lemo-Opuscar video reference.

## Local setup and checks

Use Node.js 24, Python 3.12, npm and `uv`. Exact dependency versions are locked in `frontend/package-lock.json` and `backend/uv.lock`.

```bash
# Backend, from the repository root
cd backend
uv sync --frozen
export DATABASE_URL=sqlite:///./fireops.db
export FIREOPS_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# Frontend, in a second terminal from the repository root
cd frontend
npm ci
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

Backend gate: `uv run --frozen ruff check .`, `uv run --frozen pytest -q`, `uv run --frozen alembic upgrade head`, then `uv run --frozen alembic check` with `DATABASE_URL` set to a fresh local database. Frontend gate: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e`, and a GitHub Pages export/build check. Follow existing CI if local browser dependencies are unavailable.

## Next-session checklist

1. Read this handoff and `docs/RELEASE_CHECKLIST.md`; fetch the newest `main`.
2. Continue Phase 8 only. Review the site at desktop and narrow/mobile viewports, then address verified usability and accessibility issues.
3. Run applicable frontend checks and Chromium journeys; record actual Lighthouse results without inventing metrics.
4. Keep the site static and free. Do not claim API/database hosting. Leave Phases 9–10 pending until their own gates pass.
