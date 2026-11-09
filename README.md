# FireOPS Lab

**An independent, fictional-data payment operations workspace.** Explore payment batches, settlement reconciliation, exception investigations, monitoring, operational insights, and case audit trails.

[Public website](https://shaikarham.github.io/fireops-lab/) · [Architecture](docs/ARCHITECTURE.md) · [Development guide](docs/DEVELOPMENT.md) · [Release gate](docs/HIRING_MANAGER_RELEASE_GATE.md) · [Test plan](docs/TEST_PLAN.md)

> **Public reviewer edition:** GitHub Pages builds with `NEXT_PUBLIC_REVIEW_MODE=static`. The six workspace routes immediately display a read-only synthetic reconciliation showcase without waiting for the hosted API, starting a session, or showing retry/capacity prompts. The About page, project video and CV remain available. The full interactive FastAPI workflows remain in the repository for local development and are **not claimed as continuously available on GitHub Pages**. No real funds or banking connections are used.

## What a reviewer can explore

| Area | Purpose |
| --- | --- |
| Overview | Understand fictional batch outcomes and operational context |
| Payments | Review batches, controls, and simulated processing |
| Reconciliation | Compare payment instructions with settlements and classify exceptions |
| Investigations | Assign cases, add notes, escalate, resolve, and inspect audit events |
| Monitoring | Review alerts with evidence and possible benign explanations |
| Insights | Examine run-scoped metrics and export consistent CSV reports |
| About | Understand the builder, methodology, and project boundaries |

All data is synthetic. FireOPS Lab **does not transfer funds**, connect to banks, make actual fraud or AML decisions, or represent an employer's internal system. It is **not affiliated with, commissioned by, endorsed by, or connected to Fire Financial Services Limited**.

## Architecture

- **Frontend:** Next.js, TypeScript, React; static export supported for GitHub Pages.
- **API:** Python FastAPI; validated import, simulation, reconciliation, investigation and reporting endpoints.
- **Persistence:** PostgreSQL for hosted multi-user scenarios; SQLite for local development.
- **Quality gates:** Type checks, formatting, linting, unit and integration tests, migrations, and Playwright browser journeys.

The static site and API are separate deployment units. A static export alone does **not** make the API-backed controls functional. See [architecture](docs/ARCHITECTURE.md), [data dictionary](docs/DATA_DICTIONARY.md), [requirements traceability](docs/REQUIREMENTS_TRACEABILITY.md), and [decision log](docs/DECISION_LOG.md).

## Local development

Prerequisites: Node.js 24, Python 3.12, npm, `uv`.

```bash
# Terminal 1
cd backend
export DATABASE_URL=sqlite:///./fireops.db
export FIREOPS_ENV=development
export FIREOPS_ENABLE_DEMO_WRITES=true
export FIREOPS_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
uv sync --frozen
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

```bash
# Terminal 2
cd frontend
npm ci
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:3000`; API health: `http://localhost:8000/health`. Demo writes are enabled **only for this local development example**. Never apply development write settings to a public deployment.

## Reviewer release verification

The public entry point is [FireOPS Lab](https://shaikarham.github.io/fireops-lab/). The reviewer flow is: play the film, select Explore, navigate Overview → Payments → Reconciliation → Investigations → Monitoring → Insights, then inspect About and the CV. The six workspaces use the committed synthetic reconciliation summary and require no network request to the private demo service. Check the [GitHub Actions runs](https://github.com/ShaikArham/fireops-lab/actions) for commit-specific build, CI, smoke and browser results. A successful static deployment does not prove the separate interactive API is available.

## Validation

```bash
cd frontend
npm ci
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

```bash
cd backend
uv sync --frozen
uv run alembic upgrade head
uv run alembic check
uv run ruff check .
uv run pytest
```

CI results are commit-specific. A green branch workflow does not prove that the GitHub Pages URL contains that commit. Consult [the release gate](docs/HIRING_MANAGER_RELEASE_GATE.md) and [release checklist](docs/RELEASE_CHECKLIST.md) before describing a version as deployed.

See the [interactive public release gate](docs/PUBLIC_INTERACTIVE_RELEASE.md) for the verified Render/Neon status, browser security constraints, and exact release checklist.

## Public deployment requirements

1. Deploy the FastAPI service and a persistent PostgreSQL database with appropriate isolation and resource limits.
2. Implement and test secure browser sessions across the GitHub Pages origin and the API origin. Review CORS, cookie attributes, CSRF protection, write authorization, and demo-session quotas.
3. Configure the frontend's public API endpoint at build time and verify the static export's base path.
4. Test the **actual published URL** end-to-end: demo load/reset, payment simulation, reconciliation, case lifecycle, monitoring, insights CSV, mobile navigation, and accessibility.
5. Only then publish the updated branch and mark the release gate complete.

The [GitHub Pages workflow](.github/workflows/pages.yml) runs on pushes to `main` and supports manual triggering. It publishes the static reviewer edition, **not** the backend or database.

## Data and evidence

Generate deterministic fictional fixtures with:

```bash
cd backend
uv run python -m app.synthetic.generate
```

Read [project brief](docs/PROJECT_BRIEF.md), [test plan](docs/TEST_PLAN.md), and [CV claims evidence](docs/CV_CLAIMS_EVIDENCE.md) for scope and defensible claims.

## License

**All rights reserved.** This is source-available for portfolio review, not open source. Copying, modifying, or redistributing the original code or assets is not permitted without authorization, subject to applicable law and GitHub's terms. See [LICENSE](LICENSE). Third-party dependencies retain their own licenses.
