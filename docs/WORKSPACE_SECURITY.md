# Isolated demo security and deployment

This is a bounded fictional-data demo, not a production payments system. Deployment target is a Vercel preview only. No real credentials, banking details, CV or video should be uploaded.

## Architecture

Vercel Services (currently Beta) routes `/backend/*` to FastAPI and other paths to Next.js. Browser calls stay on the preview's origin. `DATABASE_URL` is a server-only PostgreSQL connection string. `FIREOPS_ISOLATED_DEMO=true` enables the guarded workspace mode; `FIREOPS_ENV=production` stays enabled on Vercel.

POST `/api/v1/demo/session` creates a cryptographically random 256-bit opaque session. Only its SHA-256 digest is stored. The cookie is HttpOnly, Secure in production, SameSite=Strict, expires after 24 hours and is never stored in localStorage. No user-supplied workspace identifier is accepted. Each visitor's ORM queries, primary keys, uniqueness constraints and foreign keys are translated into that visitor's PostgreSQL schema. Known record IDs from another workspace resolve to no record. No endpoint accepts SQL or schema names.

Every API request authenticates the cookie. Every write requires a custom header and rejects a different browser Origin or cross-site fetch. Public development-mode write bypass is not used. Development CI uses the same isolation guard with an HTTP localhost cookie. PostgreSQL integration tests exercise production mode and Secure cookies over an HTTPS TestClient origin.

Each workspace request holds a PostgreSQL transaction advisory lock. Service commits use savepoints inside that transaction, so load/reset and mutations are atomic and serialized against other requests and cleanup. NullPool avoids retaining connections across serverless invocations. Transactions have statement and lock timeouts. Database errors return a generic message, not connection details. API responses cannot be cached.

## Bounds

- At most 20 active workspaces and 5 starts per minute globally, enforced under a database lock.
- Session duration: 24 hours; expired schemas are deleted at the next session allocation. Expired sessions cannot read data before cleanup.
- Per session: 120 requests/minute, 30 writes/minute and 300 lifetime writes. Reset does not remove these quotas.
- Source files: 5 MiB maximum; public demo imports at most 2,000 records/file and 6,000 payment/settlement records total.
- New mutations stop at 50,000 stored records per workspace, with at most one bounded operation of overshoot. Reset remains available unless the lifetime request quota has been exhausted.
- Queue endpoints use bounded pagination. All source data and actor labels are fictional. Actor labels are not verified identities or RBAC accounts.

This portfolio model does not provide employee authentication, roles, regulatory retention or production banking authorization. Those are deliberate boundaries, not implied capabilities.

## Deploy and migrate

1. Provision an isolated free-tier PostgreSQL database. Never reuse an unrelated production database.
2. Set server-only `DATABASE_URL` and `FIREOPS_ISOLATED_DEMO=true`, `FIREOPS_ENV=production` for this branch's Preview environment only.
3. Run `uv run alembic upgrade head` in `backend` using that database, then `uv run alembic check`. Revision `0007_demo_registry` adds the global session registry. New visitor schemas are initialized from the current ORM metadata. Increment `SCHEMA_VERSION` whenever the visitor schema changes to expire incompatible workspaces safely.
4. Deploy from the repository root using `vercel.json`. Services builds the two subdirectories independently. Do not promote this preview to production.
5. Verify `/backend/ready`, load data, reload, run payments/reconciliation/case/monitoring/report and test a second browser context. `/backend/health` is liveness only.

The DB role needs CREATE SCHEMA and ownership of the app's schemas. Do not give this role access to unrelated databases. Project secrets must not appear in GitHub files, client bundles, command output or screenshots.

## Verification

`FIREOPS_TEST_DATABASE_URL=<dedicated disposable PostgreSQL> uv run pytest` includes real production-mode isolation, reset, cookie, CSRF, foreign-record and rate-limit tests. Never point this test variable at a live shared application database.

`npm exec playwright test -- --config=playwright.journey.config.ts` runs the real API-backed browser journey across Chromium, Firefox and WebKit, including 390, 430, 768, 1024 and 1440 pixel layouts. CI starts a disposable PostgreSQL service. Test artifacts contain fictional records only.
