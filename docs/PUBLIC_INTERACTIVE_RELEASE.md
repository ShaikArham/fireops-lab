# Public interactive release gate: GitHub Pages + Render + Neon

## Verified so far (2026-11-08)

- Render service: `https://fireops-lab.onrender.com`, deployed from `76b4767`.
- The operator observed `GET /health` HTTP 200 and `GET /ready` returned `{"status":"ready","database":"connected","isolated_demo":true}`.
- Neon has the `public.fireops_demo_sessions` table.
- The currently public GitHub Pages build is **not** the hiring-manager workspace branch.

## Blocking architecture constraint

GitHub Pages serves static files only. The current frontend makes same-origin requests to `/backend/api/v1/...`. GitHub Pages cannot proxy these routes.

The API authenticates with an HttpOnly, Secure, SameSite=Strict cookie and rejects `Sec-Fetch-Site: cross-site` writes. Simply setting `NEXT_PUBLIC_API_BASE_URL` or enabling CORS will **not** make the app work. Changing to cross-site cookies would depend on third-party cookies, which browsers may block. Do not disable the origin check or put database credentials in the frontend.

## Supported release design

**Preferred:** serve the full frontend from a host with a same-origin rewrite/proxy for `/backend/*` to the Render API, or put the frontend and API on subdomains of the same controlled domain with an audited session design. Retain GitHub Pages as a static project entry point if desired.

To insist on a fully interactive app *on the github.io origin*, implement a deliberate, tested bearer-token demo-session flow rather than relying on cross-site cookies. Required controls:
- Generate a cryptographically random, short-lived token for each synthetic workspace.
- Keep only token hashes server-side and never place tokens in URLs or logs.
- Add explicit allowed-origin validation to **all** state-changing routes, including session creation.
- Use `Authorization` and a strict CORS allowlist; never wildcard origins.
- Prevent token leakage through analytics, error messages, caches, and referrers.
- Validate session expiration, quotas, schema isolation, CSRF/XSS exposure, and reset semantics.
- Update every frontend API call, including downloads, to use the same authenticated transport.
- Test Chromium, Firefox, WebKit, mobile viewports, and browser reload/session restoration.

Do not treat a green unit-test run as a public end-to-end verification.

## Release sequence

1. Audit and implement the chosen cross-origin/session architecture on a feature branch.
2. Add backend and browser tests for positive/negative authorization, isolation, quotas, CORS, reset, CSV and reload.
3. Ensure Render is running the exact tested backend SHA, with production variables and the rotated Neon connection string.
4. Run the database migration check and verify `/ready` against Render.
5. Build the frontend with the verified backend origin, and deploy it from the exact tested commit.
6. Test the **public URL** from a fresh browser session: session creation, demo load, payments, reconciliation, investigations (assignment/notes/escalation/resolution), monitoring, insights CSV, reset, mobile, accessibility.
7. Update the README and CV only after public URL checks pass.

## Security and project boundaries

Synthetic data only. No bank integrations or real-money movement. Never commit secrets or copy private database URLs into issues, screenshots, docs, or logs. Source is viewable but not licensed for reuse; see `LICENSE`.

## Current release status

**BLOCKED for fully interactive GitHub Pages release** until the cross-origin session and transport design is implemented and verified. The backend readiness response alone is not an end-to-end pass.
