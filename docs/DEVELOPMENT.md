# Development workflow

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

