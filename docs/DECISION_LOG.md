# Decision log

> **Current release note (9 November 2026):** The public GitHub Pages reviewer edition is configured to build from `main` with `NEXT_PUBLIC_REVIEW_MODE=static`. Overview, Payments, Reconciliation, Investigations, Monitoring and Insights show an immediate, read-only showcase based on committed fictional reconciliation data. They do not start a private session or require the Render/Neon backend. The About/CV route and introduction film are separate assets. API-backed editing, case decisions and session isolation are development/optional interactive capabilities, **not guaranteed features of the public static edition**. Historical phase/branch evidence below remains a record of work at that time; do not interpret it as proof of the current live release. Verify the latest [Pages](https://github.com/ShaikArham/fireops-lab/actions/workflows/pages.yml), [CI](https://github.com/ShaikArham/fireops-lab/actions) and browser checks for the same commit before declaring a complete release.


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

## D-007 — Immutable normalized source records

- **Date:** 2026-11-07
- **Decision:** Phase 2 stores source-file metadata, payment instruction rows, and settlement rows in separate tables. Preserve repeated business references so later reconciliation can classify ambiguity instead of discarding source evidence.
- **Reason:** Input records must remain inspectable and reconciliation candidates must be explainable. IDs and idempotency keys are unique; client and payment references are indexed, not globally unique.
- **Trade-off:** The initial schema is deliberately limited to import sources. Lifecycle events, reconciliation runs, cases, alerts, and audit records will be added only in their planned phases.

## D-008 — Bounded, all-or-nothing CSV validation

- **Date:** 2026-11-07
- **Decision:** Validate UTF-8 CSVs against exact schemas, allow at most 5 MiB and 10,000 data rows, require timezone-aware timestamps, positive integer minor units, supported currencies, and `SYN-` account tokens. Reject formula-like cells, duplicate row identifiers, malformed structure, and any file containing an invalid row without returning partial records.
- **Reason:** Keep source data synthetic and prevent malformed or spreadsheet-active content from entering later workflows.
- **Trade-off:** This phase exposes validation as a Python service only. Upload endpoints, persistence, and repeat-import idempotency are Phase 3 work.

