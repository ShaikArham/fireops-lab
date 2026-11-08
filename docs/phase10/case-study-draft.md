# FireOps Lab: making payment exceptions reviewable

**Independent portfolio project · Fictional data only · Not affiliated with Fire Financial Services Limited**

## The operations problem

Payment and settlement records can arrive from separate systems with different references, timestamps and statuses. A useful operations workflow needs to identify what matches, surface what does not, show the analyst the evidence, and preserve the reasoning behind the decision.

## What I built

FireOps Lab is a payment operations simulator designed around that investigation loop. It supports synthetic payment and settlement data, controlled payment lifecycle events, deterministic reconciliation, exception cases with audit history, explainable transaction-monitoring rules, and run-scoped operational reporting.

The reconciliation engine compares selected input batches and preserves its rule version, source hashes and source-linked results. It avoids force-matching ambiguous duplicate candidates. Monitoring alerts show rule evidence and possible benign explanations, then require a human disposition.

## Demonstration result

The included exception-day dataset contains 1,250 fictional payment instructions and 1,230 fictional settlement records. A local API run returned 1,260 comparison rows: 1,218 exact matches, one late match, one amount mismatch, 20 duplicate candidates and 20 unmatched rows split across both sources. The run therefore reported 1,219 matched rows, 20 unmatched source rows and 41 exception rows. These are outputs from a deterministic fixture, not live payment results or a claim of real-world detection performance.

## Operational value demonstrated

- A reviewer can trace an exception to its source records and reconciliation run.
- The matching logic is explicit and repeatable, with ambiguous records left for review.
- Case changes retain an actor-attributed activity history.
- Reports stay tied to the selected run and export the same run's calculated data.
- Monitoring remains explainable and human-reviewed rather than presenting alerts as confirmed fraud or AML findings.

## Technology and verification

Next.js and TypeScript frontend; FastAPI and Python backend; SQLAlchemy, Alembic and PostgreSQL schema; deterministic synthetic fixtures. CI checks migrations, backend and frontend tests, dependency/secret scans, static build and browser journeys across Chromium, Firefox and WebKit.

## Honest release status

The public GitHub Pages site is a static, read-only preview. The API and database are not hosted. API-backed workflows require a separately configured local backend. The final narrated walkthrough, CV attachment, and complete release browser verification remain in progress.

## Candidate relevance

The project supports a move from enterprise BI/data operations into payment operations by showing preparation in reconciliation, exception handling, monitoring concepts, auditability and process controls. It does not claim previous production payment processing, fraud investigation, AML casework or suspicious activity report production.

**Repository:** https://github.com/ShaikArham/fireops-lab  
**Preview:** https://shaikarham.github.io/fireops-lab/
