<div align="center">

# FIREOPS LAB

### FOLLOW THE PAYMENT. FIND THE EXCEPTION.

**A synthetic payment-operations investigation and reconciliation work sample.**

[**Explore the demo**](https://shaikarham.github.io/fireops-lab/) · [**Source repository**](https://github.com/ShaikArham/fireops-lab) · [**Arham's portfolio**](https://arham-bi.vercel.app/)

![Project](https://img.shields.io/badge/Portfolio-Independent%20project-075d60?style=flat-square) ![Evidence](https://img.shields.io/badge/Approach-Evidence%20first-334155?style=flat-square)

*Shaik Arham Saquib · Dublin, Ireland*

</div>

---

## 01 / THE QUESTION

**A fictional batch has processed, but settlement does not reconcile. What evidence explains the difference?**

The project connects simulated payment events to reconciliation exceptions, case investigation, monitoring and evidence-led decisions.

> **The goal:** Show the reasoning behind the result, not just the interface that displays it.

## 02 / AT A GLANCE

**Payments | Reconciliation | Investigations | Monitoring | Insights**

| Reviewer's lens | What to look for |
| :--- | :--- |
| **Product thinking** | The operational question and intended user journey |
| **Engineering** | Next.js 16, React 19, TypeScript, FastAPI, SQLAlchemy, Alembic, PostgreSQL and Playwright. |
| **Evidence** | Reproducible examples, explicit rules and documented boundaries |
| **Trust** | Public GitHub Pages is a read-only showcase, not a verified hosted write-enabled backend. No real payments or AML decisions. |

## 03 / FIVE-MINUTE REVIEW

Watch the introduction, trace a mismatch from Payments to Reconciliation and Investigations, then inspect the architectural and testing documentation.

## 04 / WHAT IT DEMONSTRATES

- **Problem framing:** Make the operational decision and its context explicit.
- **Traceability:** Explain the inputs, transformations and outputs a reviewer can inspect.
- **Responsible claims:** Separate fictional scenarios, demonstrated results and future work.
- **Communication:** Make technical decisions understandable to both analysts and hiring managers.

## 05 / IMPLEMENTATION AND REPRODUCTION

The original project documentation follows below, including exact commands, metric definitions, architecture, test evidence and limitations where available. The project README remains the authoritative source for its own implementation details.

---

## Detailed project documentation

### Follow the payment. Find the exception. Document the decision.

**[Watch the introduction and explore FireOPS Lab](https://shaikarham.github.io/fireops-lab/)** · [Open the reviewer workspace](https://shaikarham.github.io/fireops-lab/workspace/overview/) · [Meet the builder](https://shaikarham.github.io/fireops-lab/workspace/about/)

FireOPS Lab is an **independent payment-operations portfolio project by Shaik Arham Saquib**, based in Dublin, Ireland. I built it to demonstrate how I approach operational data quality, reconciliation, exceptions and evidence-led investigations while applying for an Operations Analyst opportunity at Fire.

**The scenario:** a fictional payment batch has processed, but its settlement does not reconcile. Where did the difference arise? Which evidence supports the finding? What should the next analyst do?

> **Reviewer note:** All records are fictional. The public GitHub Pages version is a **read-only reviewer showcase**, not the complete interactive API-backed application. It displays the desktop-width workspace on mobile, where horizontal scrolling may be needed. The full application, including state-changing investigations and simulation workflows, is available in the source code and local development setup. Do not mistake a static deployment for a working hosted backend.

## A quick review

1. [Watch the introduction](https://shaikarham.github.io/fireops-lab/) and choose **Explore FireOPS**.
2. Open **Payments** to understand the fictional batch and its processing controls.
3. Follow the mismatch through **Reconciliation** and **Investigations**.
4. Explore **Monitoring** and **Insights**, then see [About the builder](https://shaikarham.github.io/fireops-lab/workspace/about/) for background, CV and project boundaries.

| Workspace | What it demonstrates |
| --- | --- |
| Overview | Operational context and synthetic batch outcomes |
| Payments | Payment records, validation concepts and simulated processing |
| Reconciliation | Matching instructions and settlements, and classifying exceptions |
| Investigations | Evidence, case lifecycle, notes and auditability in the full app |
| Monitoring | Alert review and evidence-led assessment |
| Insights | Metrics, trends and consistent reporting outputs |
| About | The builder's background, approach and source-code links |

## Why I built this

At **Hitachi Digital Services**, I worked with SQL and PL/SQL, enterprise BI and ETL monitoring, validation, troubleshooting and operational reporting. FireOPS Lab translates those transferable skills into a fictional payment-operations setting. It is a work sample and learning project, **not a claim of prior professional payment-processing, fraud investigation or AML compliance experience**.

The project deliberately distinguishes a recorded event from an analyst conclusion: reconciliation differences require supporting evidence, alert flags require investigation, and case actions should leave a traceable audit record.

## What is actually deployed?

| Component | Status / boundary |
| --- | --- |
| Public website | GitHub Pages static export; introduction, workspace showcase, About and CV |
| Mobile presentation | Desktop-width workspace shown on mobile; scroll horizontally where necessary |
| Reviewer data | Committed synthetic records; no real accounts or transfers |
| Full interactive frontend | Implemented in the repository; requires a working API and session |
| Backend | FastAPI service, with database-backed operations and tests |
| Public write-enabled demo | **Not verified or enabled by the GitHub Pages static export** |

The website is not affiliated with, commissioned by, endorsed by, or connected to Fire Financial Services Limited. It does not move money, connect to banks or make real fraud or AML decisions.

## How it is built

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS; static GitHub Pages export.
- **Backend:** Python 3.12, FastAPI, SQLAlchemy, Alembic and PostgreSQL; SQLite for local development.
- **Validation:** synthetic fixtures, backend tests, frontend unit tests, TypeScript checks, lint and formatting, Playwright browser journeys and GitHub Actions.
- **Operational controls:** fictional payment processing, reconciliation, exception investigations, monitoring, reporting and audit trails.

Read the [architecture](docs/ARCHITECTURE.md), [data dictionary](docs/DATA_DICTIONARY.md), [requirements traceability](docs/REQUIREMENTS_TRACEABILITY.md), [decision log](docs/DECISION_LOG.md) and [test plan](docs/TEST_PLAN.md).

## Run the full interactive application locally

Prerequisites: Node.js 24, Python 3.12, npm and `uv`.

**Terminal 1: backend**

```bash
cd backend
export DATABASE_URL=sqlite:///./fireops.db
export FIREOPS_ENV=development
export FIREOPS_ENABLE_DEMO_WRITES=true
export FIREOPS_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
uv sync --frozen
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

**Terminal 2: frontend**

```bash
cd frontend
npm ci
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

Open `http://localhost:3000` and check `http://localhost:8000/health`. The write-enabled settings above are **for local development only**. Never enable public writes without appropriate isolation, authentication, abuse controls and security testing.

## Quality and release evidence

[View GitHub Actions](https://github.com/ShaikArham/fireops-lab/actions) · [Release checklist](docs/RELEASE_CHECKLIST.md) · [Hiring-manager release gate](docs/HIRING_MANAGER_RELEASE_GATE.md) · [Public interactive release requirements](docs/PUBLIC_INTERACTIVE_RELEASE.md)

```bash
cd frontend
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium firefox webkit
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

**Important:** A successful GitHub Pages build verifies publication, not live API-backed interactivity. Workflow results are specific to their commit. Check the latest Actions run and the actual published URL before treating a release as verified.

## Next release milestone

Restore the full interactive experience for public reviewers by hosting the API with safe, isolated synthetic demo sessions, validating cross-origin browser authentication and CORS/CSRF protections, and completing end-to-end tests on the published URL for desktop and mobile. Do not enable public write operations until these checks pass.

## Additional resources

[Development guide](docs/DEVELOPMENT.md) · [Project brief](docs/PROJECT_BRIEF.md) · [CV claims evidence](docs/CV_CLAIMS_EVIDENCE.md) · [Branch and documentation inventory](docs/BRANCH_AND_DOCUMENT_INVENTORY.md)

## License and project boundaries

**All rights reserved.** Source is available for portfolio review, not licensed as open source. See [LICENSE](LICENSE). Third-party components retain their respective licenses.

**Built by Shaik Arham Saquib · Dublin, Ireland.**
