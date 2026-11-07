# Data dictionary

## Boundaries and conventions

- All records in the repository are generated fiction. Account tokens begin with `SYN-`; no IBAN, card, or customer identifier is used.
- Money uses positive integer minor units with an explicit currency (`EUR`, `GBP`, or `USD`). The current fixture generator chooses integer minor units directly; it does not convert currencies.
- Timestamps are ISO 8601 with a UTC offset and are normalized to UTC by the import validator. Business dates use ISO `YYYY-MM-DD`.
- CSV imports are validated as a complete file preview. If any row or header is invalid, the result contains no importable records. No Phase 2 route persists uploads.
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

`status` is stored as a constrained string so lifecycle changes can be introduced in Phase 3 without changing the Phase 2 input schema. Reconciliation results, events, cases, alerts, and audit events are intentionally not persisted yet; they belong to later phases.

## Deterministic sample fixtures

The checked-in fixtures are regenerated with `uv run python -m app.synthetic.generate`. They use a fixed seed, fixed business dates, deterministic field order, UTF-8, and `\n` line endings. The manifest lists generator version, seed, row counts, intentional exception counts, and SHA-256 per CSV.

| Dataset | Instructions | Settlements | Intentional exception candidates |
|---|---:|---:|---|
| `normal_day` | 100 | 100 | 0 |
| `exception_day` | 1,250 | 1,230 | 10 missing settlement references and 10 additional instructions sharing existing client references. |

These are fixture counts, not observed production volumes or performance claims. The exception day is designed so the count difference and duplicate groups are visible from the source data; classification and reconciliation are implemented in Phase 4.
