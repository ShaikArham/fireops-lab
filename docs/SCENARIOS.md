# Planned demonstration scenarios

> **Current release note (9 November 2026):** GitHub Pages builds from `main` with `NEXT_PUBLIC_REVIEW_MODE=static`. Six public workspace routes show immediate read-only synthetic reconciliation data without starting a private API session. The static edition does not offer live case edits or payment simulations; the separate interactive API requires independent deployment and security verification. About/CV and the introduction video are separate assets. Historical branch, phase and test results below are retained as evidence of earlier work, not as current production verification. Check [GitHub Actions](https://github.com/ShaikArham/fireops-lab/actions) for passing CI, Pages and browser runs on the **same release commit**.


The Phase 2 `normal_day` fixture contains 100 instructions and 100 settlements. The Phase 4 `exception_day` fixture contains 1,250 instructions and 1,230 settlements: 10 missing settlements, 10 duplicated payment references (20 candidate instruction rows), one amount mismatch, and one settlement two days late. Its tested result totals are 1,218 exact matches, one late match, one amount mismatch, 20 duplicate candidates, 10 unmatched instructions and 10 unmatched settlements. No duplicate candidate is force-matched.

| Scenario | Expected classification / alert | Analyst action |
|---|---|---|
| Missing settlement | Unmatched instruction after expected date | Check batch completeness and timestamps; escalate for settlement confirmation |
| Duplicate instruction | Duplicate candidate | Compare business reference and idempotency fields; avoid assuming intent |
| Amount mismatch | Amount mismatch with explicit delta | Review source evidence; do not auto-approve a fee/FX explanation |
| Delayed settlement | Matched late | Show expected vs observed settlement window and ageing |
| Unusual velocity | Potential indicator requiring human review | Review event sequence and context; record reasoned outcome |
| High-value transaction | Threshold indicator | Review rule threshold and synthetic evidence without criminal attribution |
| Repeated failures then success | Potential indicator | Review failure pattern and possible benign explanation |

The Phase 4 reconciliation engine first uses exact payment reference, matching currency and direction, integer minor units, and a configurable date window (default three days). If the reference is absent, a fallback is accepted only when exactly one payment and one settlement agree on amount, currency, direction, and date. Candidate pairs outside that window or with duplicate/ambiguous source references remain unmatched. The static Pages display uses a generated subset of the same fictional fixtures and is read-only; API-backed runs persist their full result rows.

Include normal records and false positives. Do not display target sample counts or match rates until fixtures and tests establish the exact values.

## Phase 7 reporting checks

For one saved reconciliation run, the dashboard and CSV must use the same payment-batch denominator, classification counts, distinct source-side exception review exposure by currency, case timing/ageing, analyst-recorded root causes, and latest monitoring-run review rate. Identical source hashes and rules version count once in the run-history panel. Root-cause reporting excludes unresolved cases and does not infer causes from exception classifications. The optional workload exercise uses analyst-entered assumptions and must never be worded as measured savings.

