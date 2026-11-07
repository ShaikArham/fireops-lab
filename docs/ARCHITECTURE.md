# Architecture, dependencies, cost, and acceptance criteria

**Decision date:** 7 November 2026  
**Status:** Phase 0 decision; versions are locked in the Phase 1 foundation.

## Architecture decision

Use a small monorepo with two separately runnable applications and one database:

```text
Browser
  -> Next.js 16 / React / TypeScript UI
  -> FastAPI JSON API
  -> domain services (ingestion, lifecycle, reconciliation, cases, monitoring, reporting)
  -> SQLAlchemy repositories -> PostgreSQL 17
```

The frontend owns navigation, accessible presentation, filters, and charts. The FastAPI backend owns validation, state transitions, matching, monitoring rules, audit writes, and exports. SQLAlchemy models and Alembic migrations persist records. Domain logic must not depend on FastAPI routes or React. Pandas is limited to tabular ingestion/reporting edges; money calculations use integer minor units.

This split suits the requested Python business logic and React recruiter-facing UI. It preserves an inspectable, deterministic core while avoiding premature microservices, authentication, LLMs, and payment-provider integrations. The public sample should be read-only by default; any write interaction must use an isolated demo workspace with deterministic reset.

## Technology and exact version baseline

These stable versions were resolved from the available npm/Python package indexes on 7 November 2026. Exact application dependency pins and lockfiles are required. The install/build gate must validate the complete set before Phase 1 is considered done.

| Area | Baseline |
|---|---|
| Runtime | Node.js 24.22.1; Python 3.12.14 |
| Web framework | Next.js 16.4.5; React 19.3.1; React DOM 19.3.1 |
| Language / CSS | TypeScript 5.9.3; Tailwind CSS 4.3.5; PostCSS 8.5.32 |
| UI | shadcn/ui components checked into `frontend/src/components/ui`; Radix Dialog 1.3.1; Lucide React 1.70.0 |
| Charts | Recharts 3.10.1 |
| API | FastAPI 0.162.2; Pydantic 2.14.3; Uvicorn 0.54.0 |
| Persistence | SQLAlchemy 2.0.52; Alembic 1.20.1; PostgreSQL 17.11; Psycopg 3.3.8 |
| Data | pandas 3.1.1 |
| Backend quality | pytest 9.2.0; Ruff 0.17.4; HTTPX2 2.16.0 (FastAPI TestClient transport) |
| Frontend quality | Biome 2.6.6; Vitest 5.1.0; Playwright 1.65.0 |

`shadcn/ui` is a component source, not a runtime dependency to pin as a library. Add only components the interface actually uses. Lock all transitive dependencies in `package-lock.json` and `uv.lock`. Do not use experimental releases. Reconfirm the chosen versions and peer ranges when installing; if any version above is unavailable or incompatible, update this table and the decision log with the observed reason before proceeding.

Biome is used for frontend formatting and linting. ESLint 10 is published, but Next.js 16.4.5's bundled React and accessibility plugins currently declare support only through ESLint 9; the initial flat-compatibility setup also failed a local smoke run. Keep linting on a stable, lockfile-pinned toolchain and add targeted accessibility/browser checks during the UX gates.

## Free deployment and cost assessment

The deployment target is **$0/month**, with no paid plan, custom domain, credit-based service, or paid AI/video tool required:

| Component | Free target | Limits to account for |
|---|---|---|
| Public source and CI | GitHub Free public repository and GitHub Actions within current included quotas | Recheck usage limits before release. |
| Frontend | GitHub Pages from the public repository | Static HTML/CSS/JS only. Next.js must use static export. It cannot run FastAPI, server actions, or other Python/Node server features. |
| API | Render Free Python web service | Sleeps after 15 idle minutes and may take about a minute to wake. Keep the first screen and sample walkthrough useful while the API wakes; never use its ephemeral disk as durable storage. |
| Database | Neon Free PostgreSQL | 100 compute-hours and 1 GB storage per project; compute scales to zero after inactivity. Keep the schema and synthetic dataset small. |
| Domain / media / AI | None required | Use the default GitHub Pages URL, OBS/FFmpeg/Audacity, and deterministic rules. Do not add paid subscriptions. |

GitHub Pages is available for public repositories on GitHub Free. It publishes static files and does not support Python or other server-side languages. Next.js static export supports only features that can be generated at build time; remove server-dependent features from the frontend and call the separately hosted FastAPI API from the browser when needed.

**Reliability trade-off:** this plan costs $0 but is not always-on. The API and database can sleep. The main demo page should load from GitHub Pages immediately, and the UI should show a clear loading state when an API request wakes the free service. If the free provider limits change, keep the deployment at $0 and adjust the architecture instead of silently moving to a paid tier.

No deployment is configured or triggered in Phase 1. A manual GitHub Pages release workflow will be added, but it must only run at the final release gate after browser, mobile, data-integrity, and security checks pass.

## Security and data boundaries

- No live payment execution, real bank credentials, real customer data, actual IBANs/cards, production fraud scoring, or regulatory reports.
- Use fictional names and non-routable token-like identifiers only.
- Keep secrets out of the repository and browser bundle; validate required configuration at startup.
- Bound CSV size and row count, validate schema/encoding, neutralise spreadsheet formulas on export, and avoid arbitrary file execution.
- Use parameterised SQL, explicit CORS allowlists, least-privilege database credentials, and rate limits for any public write endpoint.
- Separate source records, derived reconciliation results, cases, alerts, and audit events. Preserve original imports and immutable reconciliation run metadata.

## Acceptance criteria

| ID | Acceptance condition | Evidence / gate |
|---|---|---|
| A1 | Each in-scope job duty maps to a visible feature or explicit out-of-scope boundary. | Requirement traceability reviewed at Phase 0. |
| A2 | The app clearly states fictional data and independence from Fire on key pages. | Screenshot and content check at Phases 1 and 8. |
| A3 | No real payment or AML claim is made; all alerts require human review. | Copy review plus tests at Phases 6 and 10. |
| A4 | Local clean clone starts both services from documented commands. | Fresh clone run, frontend build, API health smoke at Phase 1. |
| A5 | Identical inputs and rule versions produce identical reconciliation outcomes; each settlement can match at most one instruction. | Unit/property tests at Phase 4. |
| A6 | Invalid CSV rows are isolated with useful row-level reasons, and reimport cannot inflate totals. | Import integration tests at Phase 2/3. |
| A7 | A case can be investigated, noted, escalated/resolved, reopened with justification, and audited. | API and browser E2E tests at Phase 5. |
| A8 | Monitoring rules explain evidence and false positives; alerts are not verdicts. | Rule and workflow tests at Phase 6. |
| A9 | Dashboard, API, and exports agree on denominator, period, and totals. | Metric/export tests at Phase 7. |
| A10 | Core user journey works with keyboard and at mobile widths, without sign-in. | Browser QA at Phases 8–10. |
| A11 | CI, dependency/security checks, and release checklist pass with no P0/P1 defects. | CI logs, scans, and release evidence at Phase 9/10. |
| A12 | Public URL, source repo, video/captions (if included), downloads, and CV bullets are manually verified. | Dated release evidence and browser checks at Phase 10. |

## Deployment remains a release-gate task

The $0 architecture is decided, but provider accounts, quotas, CORS origins, API URL, and database region must be rechecked before the final release. Never equate a static export with a working end-to-end deployment.

