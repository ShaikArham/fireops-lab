# FireOps Lab

An independent payment operations, reconciliation, and transaction investigation sandbox for a portfolio. It uses synthetic data only and is not affiliated with Fire Financial Services Limited.

> **Build status:** Phases 0–7 are complete; Phase 8 design and recruiter-journey work is in progress. The public GitHub Pages site still serves the earlier read-only reconciliation preview. The expanded static investigation and sample-insights experience is under review and has not been published. The API/database are not deployed.

## Project boundaries

- This project does not move money or connect to real financial systems.
- Every person, company, account token, payment, balance, and alert in the demo must be fictional.
- Monitoring signals require human review. They are not findings of fraud or money laundering and are not regulatory advice.
- The project is not affiliated with, commissioned by, endorsed by, or connected to Fire Financial Services Limited.

## Architecture

See [the project brief](docs/PROJECT_BRIEF.md), [architecture and cost decisions](docs/ARCHITECTURE.md), [data dictionary](docs/DATA_DICTIONARY.md), [requirement traceability](docs/REQUIREMENTS_TRACEABILITY.md), and [decision log](docs/DECISION_LOG.md).

The product is a statically exported Next.js and TypeScript web app, a Python FastAPI API, and PostgreSQL. Domain logic lives in tested backend services, separate from HTTP routes and UI components. The release target remains free GitHub Pages for the public static experience. The API/database are not hosted; no paid service is required to build or view the static demo.

See [development workflow](docs/DEVELOPMENT.md) for branch and local setup conventions.

## Run the local applications

Requirements: Node.js 24, Python 3.12, npm, and `uv`.

```bash
# Terminal 1: backend database and API
cd backend
export DATABASE_URL=sqlite:///./fireops.db
export FIREOPS_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
uv sync --frozen
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2: frontend
cd frontend
npm ci
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:3000` for the frontend and `http://localhost:8000/health` for the API health response. Phase 3 API operations require a database. The default local setup uses SQLite; CI also verifies migrations with PostgreSQL 17.

The browser workspace can preview validated CSVs, import them atomically, display payment-batch control totals, simulate lifecycle transitions, inspect event history, and compare payment instructions with settlement records. Reconciliation requires an explicit payment batch and settlement batch selection. Runs are saved with rule version, source hashes, classification counts and paginated results. API-backed exception cases support assignment, notes, controlled review, escalation, resolution and justified reopening, with an actor-attributed audit history. Resolving a case requires an analyst-selected root-cause category. Monitoring alerts require human review and include rule thresholds, evidence, possible benign explanations, auditable review actions, and a simulated internal escalation note. Run-scoped operational insights derive counts, exact-match rates, exception review exposure, case timings/ageing, root-cause distribution and alert review rate from saved records. CSV exports are generated from the same report calculation and stay tied to the selected run. GitHub Pages shows a read-only synthetic reconciliation preview; API-backed operations require a separately operated backend. The API does not execute payments.

The GitHub Pages publishing workflow is manual-only. The current static demo is available at [fireops-lab on GitHub Pages](https://shaikarham.github.io/fireops-lab/). GitHub Pages serves static frontend files; the FastAPI service and PostgreSQL database are not hosted by that workflow.

## Generate the synthetic datasets

```bash
cd backend
uv run python -m app.synthetic.generate
```

The command writes deterministic CSV fixtures and `data/synthetic/manifest.json`. The API exposes `POST /api/v1/source-files/preview?kind=payment_instructions`, `POST /api/v1/source-files/import/payment_instructions`, the equivalent settlement routes, `GET /api/v1/batches`, and payment event history. Imports use a SHA-256 plus source type as their idempotency key. Validation is all-or-nothing. See the OpenAPI page at `http://localhost:8000/docs` while the API is running.

## Checks

```bash
cd frontend
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e

cd ../backend
uv run alembic upgrade head
uv run alembic check
uv run ruff check .
uv run pytest
```

## Project phases

The phase gates and evidence are tracked in [the release checklist](docs/RELEASE_CHECKLIST.md). See [the test plan](docs/TEST_PLAN.md) and [CV claims evidence](docs/CV_CLAIMS_EVIDENCE.md). No later-phase features or CV claims should be described as complete until their code and tests demonstrate them.

