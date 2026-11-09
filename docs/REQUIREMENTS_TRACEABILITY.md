# Requirement-to-feature traceability

> **Current release note (9 November 2026):** GitHub Pages builds from `main` with `NEXT_PUBLIC_REVIEW_MODE=static`. Six public workspace routes show immediate read-only synthetic reconciliation data without starting a private API session. The static edition does not offer live case edits or payment simulations; the separate interactive API requires independent deployment and security verification. About/CV and the introduction video are separate assets. Historical branch, phase and test results below are retained as evidence of earlier work, not as current production verification. Check [GitHub Actions](https://github.com/ShaikArham/fireops-lab/actions) for passing CI, Pages and browser runs on the **same release commit**.


| Fire Operations Analyst responsibility | Planned visible feature | Data / rules evidence | Verification gate |
|---|---|---|---|
| Payment file intake and data quality | Synthetic CSV preview with all-or-nothing validation and row-level errors | Exact schema, byte/row bounds, SHA-256, synthetic account tokens, integer minor units, deterministic fixtures | Phase 2: import validation tests; Phase 3: persistence and idempotent import tests |
| Daily payment processing | Instruction intake, validation, lifecycle simulation, batch control totals | PaymentInstruction, PaymentEvent, allowed state transitions | Phase 3: transition and import integration tests |
| Payment and settlement reconciliation | Run summary, result list, source comparison, totals by currency | Versioned deterministic one-to-one matching; minor-unit amounts | Phase 4: exact/missing/duplicate/late/mismatch cases and invariants |
| Investigate operational exceptions | Filterable queue, evidence view, notes, ownership, next action, status history | ExceptionCase, CaseActivity, AuditEvent | Phase 5: missing-settlement journey under two minutes and full audit trail |
| Suspected fraud review | Synthetic indicator workflow with evidence and human-review choice | Transparent fictional rules and review lifecycle; no accusation | Phase 6: false-positive and state-transition tests |
| Transaction/event monitoring and AML-adjacent controls | Explainable educational rule alerts and mock internal escalation note | Rule version, threshold, evidence fields, human-review requirement | Phase 6: rule tests; alert never implies confirmed misconduct |
| Continuous operational improvement | Reconciliation/exception trends, ageing, root-cause categories, hypothetical process comparison | Explicit denominators and windows; measures derived from fixture data | Phase 7: metric and export parity tests |
| Accuracy and attention to detail | Source checksums, input validation, integer money, deterministic fixtures | Reproducible generator, immutable sources and runs | Phases 2–4: repeatability and validation tests |
| Documentation and concise communication | Case summary export, methodology, README, one-page case study | Evidence references, reasoning, disclaimer, reviewer status | Phases 5, 8, 10: content and browser checks |
| Initiative and fintech interest | Two-minute guided sample investigation and process insight | Fictional sample day with explicit limitations | Phase 8/10: unassisted recruiter walkthrough |

## Boundaries

Fire's supplied job description motivates the scenario selection. Fire did not provide project requirements, customer data, payment access, or an endorsement. The app does not perform real payment operations, prove fraud, file a suspicious activity report, perform KYC/sanctions checks, or certify AML compliance.

