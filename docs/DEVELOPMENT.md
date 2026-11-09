# Development workflow

> **Current release note (9 November 2026):** The public GitHub Pages reviewer edition is configured to build from `main` with `NEXT_PUBLIC_REVIEW_MODE=static`. Overview, Payments, Reconciliation, Investigations, Monitoring and Insights show an immediate, read-only showcase based on committed fictional reconciliation data. They do not start a private session or require the Render/Neon backend. The About/CV route and introduction film are separate assets. API-backed editing, case decisions and session isolation are development/optional interactive capabilities, **not guaranteed features of the public static edition**. Historical phase/branch evidence below remains a record of work at that time; do not interpret it as proof of the current live release. Verify the latest [Pages](https://github.com/ShaikArham/fireops-lab/actions/workflows/pages.yml), [CI](https://github.com/ShaikArham/fireops-lab/actions) and browser checks for the same commit before declaring a complete release.


## Branches

- `main` is the stable branch.
- Use short-lived `feature/<topic>` branches for phase work, such as `feature/synthetic-fixtures` and `feature/reconciliation`.
- Merge only after local checks and GitHub Actions pass. Use pull requests for reviewable changes.
- Suggested GitHub labels: `phase-0` through `phase-10`, `bug`, `documentation`, `security`, `dependencies`, `blocked`, `needs-review`.

## Local setup

1. Install Node.js 24, Python 3.12, npm, and `uv`.
2. Copy `.env.example` to `.env` only when local configuration is needed. Never commit `.env`.
3. Follow the frontend and backend commands in the root README.
4. Run all relevant checks before committing. Do not start a later product phase until the current phase exit gate is met.

## Data and secrets

Keep generated datasets separate from source code and tests. Fixtures must be reproducible and synthetic. Never add application credentials, financial records, government identifiers, or personal customer data to tests, issue reports, or commit history.

## No-cost release target

The planned frontend build is a Next.js static export published on GitHub Pages. The publishing workflow is manual and must not be run until the Phase 10 release gate. GitHub Pages cannot host the FastAPI process; the API and PostgreSQL database will use free tiers with their idle-sleep and quota limits documented in `ARCHITECTURE.md`.

