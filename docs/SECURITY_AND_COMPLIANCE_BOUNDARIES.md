# Security and compliance boundaries

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
- Keep shared sample data read-only or use an isolated resettable workspace.
- Log material case and rule changes with actor, timestamp, reason, and before/after context.
- Run dependency and secret scans before release.

