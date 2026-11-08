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
| Reconciliation | Exact match, date-window fallback, ambiguous candidates, duplicates, missing settlement, unmatched settlement, mismatch, late match, no cross-currency/direction matching, one-to-one invariant, integer minor-unit differences, stable input hashes, persisted run pagination |
| Cases | Allowed/blocked transitions, note and assignment audit events, escalation, resolution, justified reopen, export accuracy |
| Monitoring | Amount, velocity, repeated failures, duplicate reference, false positives, threshold boundaries, human review and dismissal reason |
| Reporting | Denominators, date windows, currency aggregation, API/UI/export parity, no invented savings |
| UI / E2E | First visit, static side-by-side synthetic reconciliation, API-backed run, CSV preview/import, batch control totals, processing simulation, event history, investigate missing settlement, record note, escalate, review alert, export, reset, keyboard, mobile widths, browser-engine coverage |
| Release / security | Dependency and secret scans, CORS/write protections, reset isolation, malformed input, broken backend state, browser and link checks |

## Phase 8 responsive, access and performance checks

- Exercise the public read-only recruiter path from reconciliation to the synthetic investigation walkthrough, monitoring rule definitions and fixture-derived insights. Clearly separate browser-visible sample content from API/database-backed workflows.
- Run viewport checks at 320, 375, 390, 768, 1024 and 1366 CSS pixels. Assert the document does not overflow horizontally and that the mobile section menu remains keyboard accessible.
- Verify the skip link is the first keyboard target, visible focus remains clear, landmark/heading names are present, and reduced-motion preferences do not introduce animation.
- Run Playwright journeys in Chromium, Firefox and WebKit in CI.
- Check static export budgets: entry HTML <= 60 KB, JavaScript <= 800 KB total, and CSS <= 40 KB total (uncompressed). Treat gzip figures as a build estimate, not an observed browser transfer or Core Web Vitals result.
- Lighthouse and manual real-device review remain release evidence to collect against the final published URL in Phase 10. Do not state a Lighthouse score or mobile-device pass before that run.

## Evidence rules

Record exact command, version, result, date, commit, environment, and any skipped checks. A green frontend build is not an API integration test; API tests are not browser verification; preview deployment is not production verification.



## Phase 9 hardening checks

- Verify API reads remain available while POST, PUT, PATCH and DELETE requests return 503 unless local development and the explicit demo-write opt-in are both set. Verify production mode stays read-only even when the opt-in is present.
- Verify the CORS allowlist accepts only explicit valid origins, rejects wildcard, malformed, userinfo and invalid-port origins, disables credential sharing and requires HTTPS for explicitly configured non-development origins.
- Exercise oversized uploads, malformed/invalid CSV, exact row/file limits, formula-like CSV input rejection, and spreadsheet-safe report exports. Use a fresh test database per test; do not expose a reset endpoint for shared data.
- Run `npm audit --audit-level=high` and `uv run --with pip-audit==2.10.1 pip-audit --local` against the resolved frontend and Python dependencies. Run pinned `detect-secrets` across the checkout, review findings, check GitHub secret-scanning alerts before release, and confirm `.env` is not tracked.
- Keep shared anonymous writes and any hosted API deployment blocked until an isolated session/authentication design, host-level rate limits and operational reset/backup plan are reviewed. The current project has no hosted API/database and no public reset route.
- Exit gate: CI green; no known critical/high security defects; public API mutations disabled by default; data/import/export boundaries verified; dependency audit clean; release blockers recorded.
