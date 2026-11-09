# FireOps workspace audit — 8 November 2026

> **Current release note (9 November 2026):** GitHub Pages builds from `main` with `NEXT_PUBLIC_REVIEW_MODE=static`. Six public workspace routes show immediate read-only synthetic reconciliation data without starting a private API session. The static edition does not offer live case edits or payment simulations; the separate interactive API requires independent deployment and security verification. About/CV and the introduction video are separate assets. Historical branch, phase and test results below are retained as evidence of earlier work, not as current production verification. Check [GitHub Actions](https://github.com/ShaikArham/fireops-lab/actions) for passing CI, Pages and browser runs on the **same release commit**.


Scope: `feat/hiring-manager-workspace`, the rebuilt frontend, secure demo integration, PostgreSQL behavior and release checks. Count findings, not an invented 100/100 quality score. Implementation does not equal a verified hosted release.

| # | Finding | Implemented correction |
|---|---|---|
| 1 | No database configured on Vercel | Same-origin backend deployment prepared; hosted provisioning still needs verification |
| 2 | Public writes required the development bypass | Separate production isolation mode |
| 3 | All visitors would share source IDs and records | Per-visitor PostgreSQL schemas |
| 4 | No visitor authentication | Random HttpOnly session cookie, hashed server-side |
| 5 | Cross-site writes had no session guard | Exact-origin and custom-header checks |
| 6 | No session expiry | 24-hour expiry and schema cleanup |
| 7 | Anonymous resource allocation unbounded | Global capacity and allocation rate caps |
| 8 | No persistent request rate limit | Database-backed per-minute and lifetime quotas |
| 9 | Imported demo data unbounded across files | Per-file and per-workspace source quotas |
| 10 | Repeated runs could grow records indefinitely | Total-record budget and lifetime writes |
| 11 | Serverless connection reuse unspecified | NullPool and bounded DB transactions |
| 12 | Reset could race with ongoing mutations | Workspace transaction lock and atomic reset |
| 13 | No easy usable demo initialization | Idempotent Load Demo Data action |
| 14 | No visitor-specific reset | Reset My Demo with explicit confirmation |
| 15 | Liveness implied database readiness | Separate database readiness endpoint |
| 16 | API errors could expose database details | Generic database failure responses |
| 17 | Stateful API responses could be cached | Private no-store responses |
| 18 | Case queue lacked search | Case/payment/settlement/owner search |
| 19 | Case queue lacked priority filter | LOW/NORMAL/HIGH filter |
| 20 | Case notes leaked between selected records | Reset draft fields on selection |
| 21 | Alert notes leaked between selected records | Reset alert draft fields on selection |
| 22 | Selection could race with writes | Disable selection and inputs while busy |
| 23 | Case detail lacked source evidence | Display selected case's source records and run |
| 24 | Cases after first page inaccessible | Previous/next queue pages |
| 25 | Alerts after first page inaccessible | Previous/next alert pages |
| 26 | Reconciliation showed only a small initial slice | API result pagination |
| 27 | Stale filtered responses overwrote current queue | Request sequence guards |
| 28 | New monitoring runs retained stale filters | Reset queue filters and offsets |
| 29 | Source/file changed during validation | Disable controls while pending, clear stale preview |
| 30 | Processing another batch left wrong selection | Set active batch and clear old event details |
| 31 | Record details stayed visible while loading another | Clear stale payment/event details |
| 32 | Stalled requests and HTML errors were unclear | Shared timeout and error handling |
| 33 | Reports/batch choices stayed stale after actions | Shared operations update event and refresh actions |
| 34 | Download allowed duplicate requests and early URL revoke | Pending control and delayed cleanup |
| 35 | Empty currency exposure appeared as euro zero | Explicit no-exposure state |
| 36 | Matching definition excluded fallback matching | Correct explanatory copy |
| 37 | Preview silently truncated rows/errors | Explicit preview limits and truncation state |
| 38 | Machine evaluation described as human review | Correct monitoring wording |
| 39 | Long checksums/identifiers threatened mobile overflow | Wrapping and shrinkable grid items |
| 40 | Small touch targets and inconsistent focus | 44px targets and shared keyboard focus styling |
| 41 | Workspace routes lacked a skip link | Global skip-to-main navigation |
| 42 | Motion lacked a full reduced-motion override | Disable animations/transitions when requested |
| 43 | Landing page rendered literal backslash-n text | Remove embedded escape text |
| 44 | About lacked motivation and engineering rationale | Explain transferable skills, choices and limitations |
| 45 | Browser checks targeted stale navigation text | Update selectors to rebuilt route/navigation structure |
| 46 | No real multi-browser isolated journey | PostgreSQL-backed journey workflow, all three engines/five widths |
| 47 | Isolation was untested | Four PostgreSQL production-mode security integration tests |
| 48 | Release status mixed implementation and proof | Explicit test and deployment status in handoff |

The final status and unresolved failures belong in `HIRING_MANAGER_REBUILD_HANDOFF.md`. No claim is made that these are every possible defect or that production-grade financial controls have been implemented.
