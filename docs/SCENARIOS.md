# Planned demonstration scenarios

These are design targets only; no scenario engine is implemented yet. Every scenario needs fixture inputs, expected output, analyst next action, a test assertion, and a truthful walkthrough script before it is shown in the app.

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

