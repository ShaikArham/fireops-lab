# Planned demonstration scenarios

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

## Phase 6 monitoring scenarios

The monitoring workspace evaluates four versioned rules against fictional payment/event records: high-value amount, payer velocity in a short window, repeated failed events, and duplicate client reference within a batch. Every alert displays the rule threshold and matched source evidence plus a possible benign explanation. Examples include a legitimate payroll, treasury, or supplier payment triggering the high-value threshold; batching activity creating a velocity signal; transient technical failures; or a reused client reference. These are review prompts only. A dismissal or escalation requires an analyst reason, review activity is appended to history, and the escalation summary is a simulated internal note, not a suspicious activity report or regulatory filing. No alert establishes fraud or money laundering.

Include normal records and false positives. Do not display target sample counts or match rates until fixtures and tests establish the exact values.

