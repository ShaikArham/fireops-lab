# FireOps Lab

An independent payment operations, reconciliation, and transaction investigation sandbox for a portfolio. It uses synthetic data only and is not affiliated with Fire Financial Services Limited.

> **Build status:** Phases 0–1 are complete. Phase 2 data model, synthetic fixtures, and import validation are in progress. Payment processing, reconciliation, investigation, monitoring, and reporting features are not implemented yet.

## Project boundaries

- This project does not move money or connect to real financial systems.
- Every person, company, account token, payment, balance, and alert in the demo must be fictional.
- Monitoring signals require human review. They are not findings of fraud or money laundering and are not regulatory advice.
- The project is not affiliated with, commissioned by, endorsed by, or connected to Fire Financial Services Limited.

## Architecture

See [the project brief](docs/PROJECT_BRIEF.md), [architecture and cost decisions](docs/ARCHITECTURE.md), [data dictionary](docs/DATA_DICTIONARY.md), [requirement traceability](docs/REQUIREMENTS_TRACEABILITY.md), and [decision log](docs/DECISION_LOG.md).

The planned product is a statically exported Next.js and TypeScript web app, a Python FastAPI API, and PostgreSQL. Domain logic will live in tested backend services, separate from HTTP routes and UI components. The target deployment is GitHub Pages plus free-tier API/database services, with the limits documented in the architecture decision.

See [development workflow](docs/DEVELOPMENT.md) for branch and local setup conventions.

## Run the local applications

Requirements: Node.js 24, Python 3.12, npm, and `uv`.

```bash
# Terminal 1: frontend
cd frontend
npm ci
npm run dev

# Terminal 2: backend
cd backend
uv sync --frozen
uv run uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:3000` for the frontend and `http://localhost:8000/health` for the API health response. Neither process needs a database in Phase 1. Database-backed features begin only after the relevant phase gate.

The GitHub Pages publishing workflow is manual-only and will be used at the final release gate. GitHub Pages serves static frontend files; the FastAPI service and PostgreSQL database will need separate free-tier hosting.

## Generate the synthetic datasets

```bash
cd backend
uv run python -m app.synthetic.generate
```

The command writes deterministic CSV fixtures and `data/synthetic/manifest.json`. To validate a supplied instruction CSV from Python, call `app.services.csv_validation.validate_csv(content, "payment_instructions")`; use `"settlement_records"` for settlement data. Validation is all-or-nothing and returns row-level errors without persisting data.

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

