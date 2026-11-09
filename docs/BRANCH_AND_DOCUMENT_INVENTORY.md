# Branch and documentation inventory

Updated 9 November 2026. This inventory records branches without rewriting historical phase evidence or merging unrelated changes. The supported public reviewer release source is `main`; old feature, documentation and release branches are not deployment targets.

## Branch inventory (26)

| Branch | Head (short SHA) | Classification |
| --- | --- | --- |
| `dependabot/npm_and_yarn/frontend/types/node-26.6.6` | `abc040420a` | Dependency proposal; review separately |
| `dependabot/npm_and_yarn/frontend/typescript-7.0.2` | `fe45df1942` | Dependency proposal; review separately |
| `dependabot/pip/backend/sqlalchemy-2.1.8` | `84455ec678` | Dependency proposal; review separately |
| `design/motion-ui-exploration` | `a7181af769` | Feature or fix branch; do not assume deployed |
| `docs/phase-2-release-evidence` | `f2f710f0a6` | Historical documentation |
| `docs/phase-3-release-evidence` | `f439199908` | Historical documentation |
| `docs/phase-4-release-evidence` | `5845509104` | Historical documentation |
| `docs/project-handoff` | `773a577822` | Historical documentation |
| `feat/hiring-manager-workspace` | `f5833dbf08` | Feature or fix branch; do not assume deployed |
| `feature/phase-2-data-foundation` | `67d3512476` | Historical phase work |
| `feature/phase-3-payment-lifecycle` | `5a078e4637` | Historical phase work |
| `feature/phase-4-reconciliation` | `2154235b54` | Historical phase work |
| `feature/review-activity-email` | `81e20b53dc` | Feature or fix branch; do not assume deployed |
| `fix/live-release-audit` | `83d5ab3370` | Feature or fix branch; do not assume deployed |
| `fix/production-api-and-qa` | `499e5b9fd9` | Feature or fix branch; do not assume deployed |
| `fix/real-cv-pdf-links` | `308ab53b50` | Feature or fix branch; do not assume deployed |
| `main` | `a52f82b596` | Public release source |
| `phase5/case-management-audit` | `aece826120` | Historical phase work |
| `phase6/monitoring-human-review` | `06b512da02` | Historical phase work |
| `phase7/operational-insights` | `d1aabe32dd` | Historical phase work |
| `phase8/recruiter-experience` | `05f2b12360` | Historical phase work |
| `phase8/verification-record` | `a413927b86` | Historical phase work |
| `phase9/close-evidence` | `e138508bb9` | Historical phase work |
| `phase9/security-hardening` | `3f9e51eca4` | Historical phase work |
| `phase10/fire-role-materials-draft` | `eb79c016b8` | Historical phase work |
| `release/fireops-approved-film` | `cce5cbf5e4` | Historical release branch |

## Documentation

All 19 Markdown files under `docs/` were reviewed for release-status consistency and received a dated release clarification. `README.md` describes the public reviewer edition. `frontend/AGENTS.md` is a generated Next.js agent instruction file and was intentionally left unchanged. Historical documents retain original test and branch evidence rather than being rewritten as if it applied to today's release.

## Latest observed workflow evidence

- CI: queued (commit `a52f82b596`, [run](https://github.com/ShaikArham/fireops-lab/actions/runs/42618891679)).
- Publish GitHub Pages: pending (commit `a52f82b596`, [run](https://github.com/ShaikArham/fireops-lab/actions/runs/42618890221)).
- Production smoke check: queued (commit `a52f82b596`, [run](https://github.com/ShaikArham/fireops-lab/actions/runs/42618890331)).
- FireOPS workspace browser checks: queued (commit `a52f82b596`, [run](https://github.com/ShaikArham/fireops-lab/actions/runs/42618890308)).
- CI: queued (commit `3ce7790ddc`, [run](https://github.com/ShaikArham/fireops-lab/actions/runs/42618879172)).
- Production smoke check: queued (commit `3ce7790ddc`, [run](https://github.com/ShaikArham/fireops-lab/actions/runs/42618879157)).
- FireOPS workspace browser checks: completed / cancelled (commit `3ce7790ddc`, [run](https://github.com/ShaikArham/fireops-lab/actions/runs/42618879099)).
- Publish GitHub Pages: completed / cancelled (commit `3ce7790ddc`, [run](https://github.com/ShaikArham/fireops-lab/actions/runs/42618879089)).

**Important:** Do not claim 100% pass until CI, browser checks and GitHub Pages publication all pass for the same release SHA. The public static showcase is deliberately read-only; interactive API functionality has separate verification gates.
