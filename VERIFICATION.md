# Nationwide refactor verification — October 24, 2026

## Passed
- Strict TypeScript check and Vite production build.
- 22 automated tests covering:
  - Exact viewport containment; date-line splits and nearest rendered world copy.
  - All 50 state names/codes plus DC, including Alaska and Hawaii.
  - Public API bounds validation and SQL-like input rejection.
  - Anonymous reports without a user/session, optional nickname, private salted network throttling, and HTTP 429.
  - Explicit behavior when shared storage is missing.
  - No fabricated national or Raleigh fallback data.
  - Empty write responses, price validation, freshness, and escaped tooltip strings.
- Actual Supercluster worker benchmark with a separate synthetic test fixture:
  - 100,000 input points, all 100,000 represented.
  - 176 rendered overview features.
  - Worker index construction plus transfer: 1,004 ms on this test run.
  - Date-line Alaska query: 5 ms, 171 features.
- Deployed Vercel public UI loads without login/account controls.
- Deployed city geocoding moved the map to Seattle, WA.
- No signIn/signOut/session-validation/auth-client or auth.users references remain in application/API code.

The performance fixture is synthetic, used only by scripts/benchmark-clusters.mjs, and never included as application station data. These timings are local measurements, not a production traffic or database load test.

## Current external limits
- Public Overpass providers were unreachable during deployed directory checks. The app reports this failure and offers retry rather than inventing station records or prices.
- A Supabase/PostGIS project is not configured here. SQL migrations, RLS/role behavior, query plans, shared anonymous writes, and import of a genuine 50-state catalog have not been exercised against a live database.
- supabase/verify_spatial.sql supplies rollback-only checks and an EXPLAIN query for a configured test database.
- Manual reporting API behavior is tested with mocked database responses. The current deployment explicitly labels unconnected shared storage; local manual price handling is preserved in code.
- A high-volume production launch needs the PostGIS setup and real data import described in README.md. Default public directory/geocoder services are fallback infrastructure, not a high-volume SLA.
- No raw IP addresses or account IDs are stored by the new reporting schema. A private, daily salted network hash is used only for rate limiting.

## Deployment and source
- Public URL: https://pump-scout-nine.vercel.app/
- Vercel project: prj_QzK1Tvapr50jNaZc2cihWdoXpTRk
- Source, migrations, importer, test scripts, and pinned library licenses are packaged together.
- The browser-visible CARTO key remains outside tracked source, in local/Vercel environment configuration.
- No Supabase users, external accounts, or production database records were deleted or changed; this environment had no configured application database.

Additional deployed UI checks: Hawaii shortcut navigated correctly; E85 selection and Shell brand favorite remained selected after reload; zero login controls were present; mobile content width was 375 px in a 390 px viewport (no horizontal overflow).
