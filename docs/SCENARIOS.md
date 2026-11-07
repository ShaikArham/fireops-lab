# Planned demonstration scenarios

The Phase 2 `normal_day` fixture contains 100 instructions and 100 settlements. The `exception_day` fixture contains 1,250 instructions and 1,230 settlements, with 10 missing settlement references and 10 duplicate instruction references. Phase 3 adds CSV preview/import, legal payment state transitions, immutable lifecycle events, batch controls, and deterministic settlement simulation. The reconciliation and monitoring engines are not implemented yet. Reconciliation scenarios still need tested expected classifications and a truthful walkthrough before those results are shown in the app.

| Scenario | Expected classification / alert | Analyst action |
|---|---|---|
| Missing settlement | Unmatched instruction after expected date | Check batch completeness and timestamps; escalate for settlement confirmation |
| Duplicate instruction | Duplicate candidate | Compare business reference and idempotency fields; avoid assuming intent |
| Amount mismatch | Amount mismatch with explicit delta | Review source evidence; do not auto-approve a fee/FX explanation |
| Delayed settlement | Matched late | Show expected vs observed settlement window and ageing |
| Unusual velocity | Potential indicator requiring human review | Review event sequence and context; record reasoned outcome |
| High-value transaction | Threshold indicator | Review rule threshold and synthetic evidence without criminal attribution |
| Repeated failures then success | Potential indicator | Review failure pattern and possible benign explanation |

Include normal records and false positives. Do not display target sample counts or match rates until fixtures and tests establish the exact values.

