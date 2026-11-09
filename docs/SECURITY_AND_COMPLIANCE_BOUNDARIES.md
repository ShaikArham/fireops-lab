# Security and compliance boundaries

> **Current release note (9 November 2026):** GitHub Pages builds from `main` with `NEXT_PUBLIC_REVIEW_MODE=static`. Six public workspace routes show immediate read-only synthetic reconciliation data without starting a private API session. The static edition does not offer live case edits or payment simulations; the separate interactive API requires independent deployment and security verification. About/CV and the introduction video are separate assets. Historical branch, phase and test results below are retained as evidence of earlier work, not as current production verification. Check [GitHub Actions](https://github.com/ShaikArham/fireops-lab/actions) for passing CI, Pages and browser runs on the **same release commit**.


FireOps Lab is an educational, fictional-data portfolio simulator. It is not a payment institution, bank, fraud detection system, AML product, legal service, or Fire Financial Services product.

It does not initiate, route, settle, reverse, or recover real payments; connect to banking credentials; ingest real customer data; conduct KYC or sanctions screening; decide that a person committed fraud or money laundering; prepare or submit a real suspicious activity report; or represent legal/regulatory compliance.

Monitoring outputs are potential indicators that require trained human review. The demo must show the rule, evidence, threshold, false-positive example, analyst decision, and limitations. A dismissal or escalation must include a reason. A case summary is a fictional internal training example, not a SAR or regulator form.

All sample people, companies, balances, account tokens, payment references, dates, and alerts must be fictional. Never use actual IBANs, cards, account numbers, customer data, or copied financial records.

Engineering controls to implement by phase:

- Keep secrets in environment variables and out of git history and frontend bundles.
- Bound and validate CSV input, including file size, row count, encoding, exact schema, and field values. Phase 2 rejects the entire preview if any row fails; it does not persist partial imports.
- Require `SYN-`-prefixed account tokens, reject formula-like cell values, and never accept real account/customer identifiers in sample data.
- Keep SQL parameterised; restrict CORS; use least-privilege database roles.
- Escape spreadsheet formulas in CSV exports.
- The API is read-only by default. Mutating requests return HTTP 503 unless `FIREOPS_ENV=development` and `FIREOPS_ENABLE_DEMO_WRITES=true` are both explicitly set. Production mode blocks writes even when the opt-in is accidentally set.
- Use an exact CORS origin allowlist. Wildcards and malformed origins are rejected; explicitly configured non-development origins must use HTTPS. Credentials are not enabled.
- Do not deploy or expose shared anonymous writes. Public write access remains disabled. Before enabling any hosted mutation, design per-visitor isolation or authentication and host-level rate limits. Those controls are not part of the current public release.
- No public reset endpoint exists. API tests use a new temporary SQLite database per test; the public GitHub Pages view is a committed read-only fixture. There is no hosted mutable dataset to reset or back up.
- Keep shared sample data read-only or use an isolated resettable workspace.
- Log material case and rule changes with actor, timestamp, reason, and before/after context.
- Run `npm audit --audit-level=high` and `pip-audit` against the locked frontend and Python environments in CI. CI also runs pinned `detect-secrets` across the checkout and fails on findings. The synthetic-data manifest is excluded because it intentionally stores public content checksums, not credentials.
- Keep `.env` files ignored and commit only `.env.example`. Check repository secret-scanning alerts in GitHub before release; the current review could not read that restricted alert endpoint.

