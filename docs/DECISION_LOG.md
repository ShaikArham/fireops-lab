# Decision log

## D-001 — Independent fictional-data project

- **Date:** 2026-11-07
- **Decision:** Use a distinct FireOps Lab name and a clear independence disclaimer. All scenario data is generated and fictional.
- **Reason:** Demonstrate transferable operations thinking without implying access, endorsement, or prior regulated investigations.
- **Revisit when:** Never remove the independence/data boundary; wording may be refined for clarity.

## D-002 — Modular monorepo with Next.js, FastAPI, and PostgreSQL

- **Date:** 2026-11-07
- **Decision:** Build a TypeScript Next.js frontend and Python FastAPI backend in separate directories, backed by PostgreSQL through SQLAlchemy/Alembic.
- **Reason:** Matches requested stack and keeps deterministic financial domain logic testable and separate from the recruiter UI.
- **Trade-off:** More setup than Streamlit. Keep one deployable frontend and one API; do not introduce microservices.
- **Revisit when:** The Phase 1 local skeleton or hosting preview proves this stack cannot be run reliably with available accounts/tooling.

## D-003 — Deterministic rules before AI

- **Date:** 2026-11-07
- **Decision:** Reconciliation, monitoring, severity, and workflow are explicit rules with tests. No LLM makes a case decision.
- **Reason:** Explainability and reliable evidence matter more than decorative AI for this project.

## D-004 — Integer minor units and immutable source records

- **Date:** 2026-11-07
- **Decision:** Store money as integer minor units with currency; retain source imports and version reconciliation runs.
- **Reason:** Prevent binary-float reconciliation errors and make reruns explainable.

## D-005 — No-cost hosting architecture

- **Date:** 2026-11-07
- **Date:** 2026-11-07 (updated after the user's no-cost requirement)
- **Decision:** Export the Next.js frontend as a static site for GitHub Pages, run FastAPI on Render Free, and use Neon Free PostgreSQL. Do not use paid services or silently upgrade a tier.
- **Cost basis:** $0/month within the public GitHub, Render Free, and Neon Free quotas. A custom domain is not required.
- **Trade-off:** GitHub Pages cannot host Python; the API is separate and may sleep after 15 minutes, and Neon compute scales to zero. The first page should load without the API, and the UI must handle wake-up delay.
- **Reason:** Preserve the requested Python API/PostgreSQL architecture while meeting the user's $0 deployment limit.
- **Revisit when:** Before Phase 10 deployment or if any provider changes free-tier eligibility, quotas, or terms. Keep total cost at $0.

## D-006 — GitHub repository and phase workflow

- **Date:** 2026-11-07
- **Decision:** Use `ShaikArham/fireops-lab` as the new project repository. Keep LedgerPoint and OpsResolve untouched. Build on `main` for the initial repository foundation, then use feature branches and pull requests for later phases.
- **Reason:** The user supplied the empty FireOps repository and requested work to start there.

