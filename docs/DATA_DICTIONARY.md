# Data dictionary

## Boundaries and conventions

- All records in the repository are generated fiction. Account tokens begin with `SYN-`; no IBAN, card, or customer identifier is used.
- Money uses positive integer minor units with an explicit currency (`EUR`, `GBP`, or `USD`). The current fixture generator chooses integer minor units directly; it does not convert currencies.
- Timestamps are ISO 8601 with a UTC offset and are normalized to UTC by the import validator. Business dates use ISO `YYYY-MM-DD`.
- CSV imports are validated as a complete file preview. If any row or header is invalid, the result contains no importable records. Phase 3 persists validated source records and source-file metadata; raw upload bytes are not retained.
- SHA-256 checksums are calculated over the exact original CSV bytes, including header, line endings, and UTF-8 encoding.

## CSV datasets

| File | Columns | Meaning |
|---|---|---|
| `payment_instructions.csv` | `payment_id` | Unique fictional instruction ID. |
|  | `client_reference` | Synthetic business reference. It may repeat so duplicate candidates can be demonstrated. |
|  | `created_at`, `instructed_at` | UTC event timestamps; instruction cannot precede creation. |
|  | `amount_minor`, `currency` | Positive integer amount and ISO currency code from the supported demo set. |
|  | `direction` | `INBOUND` or `OUTBOUND`. |
|  | `payer_account_token`, `payee_account_token` | Fictional `SYN-` account tokens. |
|  | `scheme` | `SEPA_CREDIT` or `SEPA_INSTANT` synthetic scheme label. |
|  | `expected_settlement_date` | Expected business settlement date, not an observed outcome. |
|  | `status` | Initial simulator state from the defined status set. State transitions are Phase 3. |
|  | `batch_id`, `idempotency_key` | Synthetic intake batch and unique request key. |
| `settlement_records.csv` | `settlement_id` | Unique fictional settlement-row ID. |
|  | `scheme_reference`, `payment_reference` | Synthetic settlement reference and matching business reference. |
|  | `settlement_date` | Observed settlement business date. |
|  | `amount_minor`, `currency`, `direction` | Observed positive amount and explicit currency/direction. |
|  | `settlement_batch_id` | Synthetic settlement batch identifier. |

## Database tables

| Table | Purpose | Main controls |
|---|---|---|
| `source_files` | Metadata for a validated source file. Raw file bytes are not stored in this table. | SHA-256, source type and checksum/type uniqueness; non-negative row count; validation status constraint. |
| `payment_instructions` | Normalized payment instruction source records. | Primary payment ID, unique idempotency key, positive integer minor units, supported currency, direction/status checks, required source-file foreign key. Client reference is indexed but not unique to allow duplicate-candidate review. |
| `settlement_records` | Normalized settlement source rows. | Primary settlement ID, positive integer minor units, supported currency/direction checks, required source-file foreign key. Payment reference is indexed but not unique because imported source data can contain duplicate references for later exception handling. |
| `payment_events` | Append-only lifecycle history for each payment. | Event type constraint, required payment foreign key, timestamp and actor, correlation identifier. |
| `reconciliation_runs` | Versioned reconciliation run summary and source hashes. | Completed status, non-negative totals, stable rule version, amount differences aggregated by currency. |
| `reconciliation_results` | Per-run classification linked to at most one payment and at most one settlement. | Unique run/payment and run/settlement pairs; explainable classification and matching method; source record required. |

`status` is stored as a constrained string so lifecycle changes can be introduced without changing the CSV schema. Exception cases store a controlled analyst-selected root cause on resolution, and the resolution activity retains the same category for audit. Monitoring runs and alerts are separate from reconciliation results.

## Deterministic sample fixtures

The checked-in fixtures are regenerated with `uv run python -m app.synthetic.generate`. They use a fixed seed, fixed business dates, deterministic field order, UTF-8, and `\n` line endings. The manifest lists generator version, seed, row counts, intentional exception counts, and SHA-256 per CSV.

| Dataset | Instructions | Settlements | Intentional exception candidates |
|---|---:|---:|---|
| `normal_day` | 100 | 100 | 0 |
| `exception_day` | 1,250 | 1,230 | 10 missing settlements, 10 duplicate groups (20 candidate instructions), 1 amount mismatch, 1 late settlement and 1 unique amount/date fallback. |

These are fixture counts, not observed production volumes or performance claims. Phase 4 classifies this fixture as 1,218 exact matches (including the one explicitly explained unique fallback), 1 late match, 1 amount mismatch, 20 duplicate candidates, 10 unmatched instructions and 10 unmatched settlements. Exact matching uses reference, currency, direction, integer minor units and a default three-day date window. Fallback requires a mutual single candidate on amount, currency, direction and date; ambiguous records are never force-matched.

## Operational insight definitions

- Exact-match rate is `MATCHED_EXACT / payment instruction count` for one saved run's payment batch. Late matches remain separate.
- Exception review exposure sums distinct payment-side and settlement-side minor-unit amounts attached to actionable exception rows, grouped by currency. It is not a loss estimate or confirmed impact.
- Average triage time runs from case creation to its first `IN_REVIEW` activity. Median resolution time runs from creation to resolution for resolved cases.
- Open-case age buckets are computed at report generation: under 24 hours, 1–3 days, and over 3 days.
- Alert review rate is alerts not in `OPEN` divided by alerts in the latest monitoring run for the same payment batch.
- Root-cause distribution counts analyst-selected causes on resolved cases. Exception classification recurrence is an observed pattern, not a diagnosed root cause.
- Reconciliation run history deduplicates identical input hashes and rules version. It is run history, not a daily time series.
