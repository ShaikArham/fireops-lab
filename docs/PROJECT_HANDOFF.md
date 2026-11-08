# FireOps Lab project handoff

**Updated:** 2026-11-08 (Europe/Dublin)  
**Owner:** Shaik Arham Saquib  
**Repository:** [ShaikArham/fireops-lab](https://github.com/ShaikArham/fireops-lab)  
**Current public static preview:** [https://shaikarham.github.io/fireops-lab/](https://shaikarham.github.io/fireops-lab/)  
**Phase 9 verified merge:** `48986c68edca884ff426ad083a16f2e3d61f4d1b` (PR #16; PR run [42432833019](https://github.com/ShaikArham/fireops-lab/actions/runs/42432833019) and post-merge CI run [42433028368](https://github.com/ShaikArham/fireops-lab/actions/runs/42433028368) passed). **Current work:** Phase 10, final release and deliverables. **Working branch:** `phase10/fire-role-materials-draft`, PR #18, latest documented commit `2b2320c914a3b80ab6d805b724cbc03ac547202b`.

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
| 8 · mobile, access and recruiter journey | Complete | Read-only sample investigation and insight journey, mobile navigation, keyboard skip link, six viewport assertions, 33 Playwright tests across Chromium, Firefox and WebKit, and static asset budgets. PR #14 and post-merge CI passed. |
| 9 · regression and security hardening | Complete | Default-deny production API writes, strict CORS validation, formula-safe CSV exports, dependency and secret scans, 94 backend tests locally, and green PR/post-merge CI. GitHub secret scanning reports no alerts. |

Phases 0–9 have passed their gates. Phase 10 is open; that is 10 of 11 phase gates by count, not a weighted estimate of all deliverables. The user wants the full website walkthrough and release preparation completed first, then will send the final CV to attach. Do not draft or publish a substitute CV.

## Phase 10 current state

- PR [#18](https://github.com/ShaikArham/fireops-lab/pull/18) contains the Fire role alignment, application-answer draft, case-study draft and expanded 90-second full-site narration/shot plan. It remains a draft; no new deployment has been made.
- The case-study draft now reports the verified deterministic exception-day output: 1,260 comparison rows, comprising 1,218 exact matches, one late match, one amount mismatch, 20 duplicate candidates and 20 unmatched rows. These are fictional fixture results only.
- The latest Phase 10 documentation commit is `2b2320c914a3b80ab6d805b724cbc03ac547202b`. Its frontend and backend CI jobs passed in run [42448130265](https://github.com/ShaikArham/fireops-lab/actions/runs/42448130265). A follow-up docs-only commit is being checked; inspect PR #18 for its latest status before relying on the result.
- The actual MP4, WebP thumbnail, timed VTT and final transcript have not been produced or verified. The public website is still the earlier static, read-only Pages preview; API-backed workflows are not publicly available.
- The user is handling the final CV copy. After receiving it, verify claims, dates, formatting and download, then attach it at the end of the website/application materials.

## Phase 4 details and verified evidence

- Exact-reference matches require equal currency, direction and integer minor-unit amount. The three-day default date window and controlled fallback are explainable.
- The fallback is accepted only for one mutual unique candidate with equal amount, currency and direction inside the date window. Duplicate and ambiguous candidates are not force-matched.
- Reconciliation requires explicit payment and settlement batch selections. Runs persist the rule version, stable input hashes, classification totals, signed differences grouped by currency and source-linked results. The read API supports pagination.
- The exception-day fixture has 1,250 instructions and 1,230 settlement records. Expected classifications: 1,218 `MATCHED_EXACT` (including one unique fallback), 1 `MATCHED_LATE`, 1 `AMOUNT_MISMATCH`, 20 `DUPLICATE_CANDIDATE`, 10 `UNMATCHED_INSTRUCTION`, 10 `UNMATCHED_SETTLEMENT` (1,260 results total).
- Local verification: Ruff; 75 backend tests; Alembic upgrade and schema check using temporary SQLite; frontend format, lint, type check, 2 Vitest tests and GitHub Pages static export passed.
- GitHub verification: Phase 4 PR run [42419935544](https://github.com/ShaikArham/fireops-lab/actions/runs/42419935544), Phase 4 post-merge run [42420031755](https://github.com/ShaikArham/fireops-lab/actions/runs/42420031755), including PostgreSQL 17.11 migration/schema checks and all 5 Chromium E2E tests.
- The manual Pages workflow succeeded in [run 42420334086](https://github.com/ShaikArham/fireops-lab/actions/runs/42420334086). GitHub Pages was enabled with Actions as its source. The live page was opened in Chromium; the side-by-side mismatch, late, missing-reference, duplicate and unique-fallback samples plus the read-only/API-not-hosted notice were observed.
- Phase 8 viewport assertions passed at 320, 375, 390, 768, 1024 and 1366 CSS pixels. Playwright cannot launch Chromium in this workspace because the browser subprocess fails with `socket() failed: Operation not permitted`; CI ran 33 tests across Chromium, Firefox and WebKit. Manual real-device review and Lighthouse remain for Phase 10.
- The frontend is hosted as static files only. The FastAPI service and database are **not** deployed. API-backed operations work only with a configured backend. Do not imply the public preview has live persistence.
- Phase 5 PR [CI run 42422701998](https://github.com/ShaikArham/fireops-lab/actions/runs/42422701998) passed PostgreSQL migrations/schema checks, backend tests, static build and all 6 Chromium E2E tests. The missing-settlement browser journey covered case creation, assignment, an evidence note, review, resolution and audit history. The browser test uses a mocked HTTP API; backend persistence is verified separately through the API tests.

## Phase 7 close evidence

Phase 7 is complete. PR [#13](https://github.com/ShaikArham/fireops-lab/pull/13) merged as `1be1a4c2622bba7a76cadf5d562cabd67274799e`. PR CI [42426952469](https://github.com/ShaikArham/fireops-lab/actions/runs/42426952469) and post-merge `main` CI [42427034900](https://github.com/ShaikArham/fireops-lab/actions/runs/42427034900) passed. Local SQLite migration/schema check, Ruff, 86 backend tests, frontend formatting/lint/typecheck, two Vitest tests and production build also passed. The Chromium suite covered operational insights and the exported run-specific CSV.

## Phase 8 close evidence

Phase 8 is complete and merged through PR [#14](https://github.com/ShaikArham/fireops-lab/pull/14) as `e76f8e736656c258f18568c4383f16e0af42e145`. PR CI [42429583246](https://github.com/ShaikArham/fireops-lab/actions/runs/42429583246) and post-merge `main` CI [42429791513](https://github.com/ShaikArham/fireops-lab/actions/runs/42429791513) passed. The full Playwright suite passed all 33 tests across Chromium, Firefox and WebKit, including the read-only recruiter journey, 320–1366 CSS-pixel viewport checks, keyboard skip navigation, API workflows and CSV download. Backend PostgreSQL migration/schema and pytest checks passed in both runs. Local frontend format, lint, typecheck, two Vitest tests, production build and static asset budget passed (43.6 KB HTML, 621.8 KB JavaScript, 20.5 KB CSS raw). No deployment was triggered. The public GitHub Pages site remains on the prior read-only preview. Asset budgets are not Lighthouse or real-device evidence; collect those during final release verification.

## Phase 9 close evidence

Phase 9 is complete. PR #16 merged as `48986c68edca884ff426ad083a16f2e3d61f4d1b`; PR CI run [42432833019](https://github.com/ShaikArham/fireops-lab/actions/runs/42432833019) and post-merge `main` run [42433028368](https://github.com/ShaikArham/fireops-lab/actions/runs/42433028368) passed. This included PostgreSQL migration/schema checks, backend tests, npm and pip audits, the pinned secret scan, frontend checks, static export, and 33 Playwright tests across Chromium, Firefox and WebKit. Local verification passed Ruff, 94 backend tests, 92% total statement coverage, fresh SQLite migration/schema checks, frontend checks, clean dependency audits and a no-findings source scan. GitHub secret scanning showed no open or closed alerts. The live Pages preview was not updated. The API/database remain unhosted, so there is no shared mutable data, reset endpoint or hosted backup job. Do not expose a hosted API until authentication or per-visitor isolation, host-level rate limits and an operational reset/backup plan are in place.

## Later phases still pending

- **Phase 10:** produce and verify the full website walkthrough video (MP4, WebP thumbnail, VTT and transcript); finalize the one-page case study and short application answers; receive and attach the user's final Fire-specific two-page ATS CV; complete the free GitHub Pages release, real-browser/mobile checks and all download tests. No 100% claim before those gates pass.

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
2. Start Phase 10 only. Review the final free deployment and verify core journeys, all downloads, video assets, CV and application materials.
3. Do not deploy an API/database or publish the full product until the final release checks are ready.
4. Keep the static site read-only, synthetic-only and free.
