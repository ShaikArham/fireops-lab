# Test plan

## Phase 1 foundation checks

- Frontend: lint, TypeScript type check, unit-test the money-formatting helper, production build.
- Backend: Ruff, pytest health endpoint, API smoke check.
- Repository: confirm `.env` and generated files are ignored; scan tracked content for obvious secrets.
- Do not claim CI or preview deployment until a remote repository and CI run exist.

## Phase 2 data and import checks

- Apply Alembic migrations to PostgreSQL 17 in CI; verify the schema matches SQLAlchemy metadata.
- Apply the migration to a temporary SQLite database in unit tests and enforce positive minor-unit amounts, supported currencies, status/direction constraints, foreign keys, and stable identifiers.
- Generate normal and exception-day fixtures twice; assert byte-identical CSVs, fixed counts, manifest hashes, and documented intentional exceptions.
- Validate both committed fixtures, including timezone-aware timestamps, supported currency, UTF-8/Unicode references, `SYN-` account tokens, duplicate IDs/idempotency keys, file-size and row-count limits, and formula-like cell rejection.
- Confirm an invalid row rejects the complete preview and does not return partial import records.
- Never use real account identifiers, IBANs, card numbers, customer data, or live records.

## Domain test matrix by phase

| Area | Required cases |
|---|---|
| Ingestion | Required columns, invalid amounts, unsupported currencies, duplicate IDs, bad timestamps, empty/oversized/malformed files, Unicode, formula-like text |
| Lifecycle | Valid transitions, blocked transitions, ordered event history, atomic import rollback, checksum idempotency, settlement reimport, simulated batch retry, source preview limit, control totals |
| Reconciliation | Exact match, date-window fallback, ambiguous candidates, duplicates, missing settlement, unmatched settlement, mismatch, late match, no cross-currency matching, one-to-one invariant, integer sums, repeatable run |
| Cases | Allowed/blocked transitions, note and assignment audit events, escalation, resolution, justified reopen, export accuracy |
| Monitoring | Amount, velocity, repeated failures, duplicate reference, false positives, threshold boundaries, human review and dismissal reason |
| Reporting | Denominators, date windows, currency aggregation, API/UI/export parity, no invented savings |
| UI / E2E | First visit, API-backed CSV preview/import, batch control totals, processing simulation, event history, later sample day, filter, investigate missing settlement, record note, escalate, review alert, export, reset, keyboard, mobile widths |
| Release / security | Dependency and secret scans, CORS/write protections, reset isolation, malformed input, broken backend state, browser and link checks |

## Evidence rules

Record exact command, version, result, date, commit, environment, and any skipped checks. A green frontend build is not an API integration test; API tests are not browser verification; preview deployment is not production verification.

