# PumpScout — crowdsourced U.S. gas-price map

Many times when preparing for a road trip, it may be hard to easily calculate the amount of money needed to spend on fuel. PumpScout is a crowdsourced U.S. gas map price tracker that allows visitors to voluntarily report gas prices at stations near them. The site allows for an interactive map with saved stations and anonymous price reporting. 

PumpScout is for any person who is interested to see fuel prices either near them or across the country, whether for leisure or trip planning.

PumpScout was created with ChatGPT Codex and Google Gemini, with prompts spoken through Wispr Flow's Windows 11 app integration. Wispr Flow helped consolidate my ideas into actionable prompts and jot down notes to track the project's progress.

Production: [https://gas-map-price-tracker.vercel.app/](https://gas-map-price-tracker.vercel.app/)

## What changed
- No signup, login, user sessions, account profiles, protected routes, or authentication SDK.
- Fuel choice, favorite brands, recent searches, bookmarks, theme, and optional report nickname use browser local storage.
- Removed Raleigh seed records and invented prices. The default is a U.S. overview, with Alaska and Hawaii shortcuts.
- Leaflet emits normalized active west/south/east/north bounds after moveend and zoomend. Requests are debounced, superseded requests are aborted, and stale responses cannot replace the current view.
- Supercluster 8.0.1 runs inside a dedicated Web Worker. Only visible clusters/markers reach Leaflet; the list renders 60 cards at a time.
- Price statistics use fresh raw station objects inside the exact active viewport. Overview aggregates do not produce made-up price averages.

## Run
Node 24 is recommended.
```sh
npm ci
npm run dev
npm test
npm run test:scale
npm run build
```
Vite includes the same public API handlers for local development. Vercel deploys the api/ handlers as public Node.js functions.

## Current data modes
Without database configuration, the site discovers real OpenStreetMap gas stations in a city-size viewport through a server proxy. City, ZIP, address, and state searches work nationwide; all 50 state names/codes plus DC resolve without calling a geocoder. Zoomed-out views ask users to search or zoom in instead of downloading a national directory from a public service.

No current retail prices are fabricated. Anonymous manual reports work immediately in local storage and are explicitly labeled as visible only in that browser. Public shared reports become available when the database read/write configuration is present.

This public-directory fallback is for light use, not a high-volume data service. National overview clusters and sustained production traffic require a populated PostGIS catalog. Set OVERPASS_URL to your hosted provider for directory fallback traffic, and GEOCODER_URL to a compatible hosted/self-hosted Nominatim service for higher-volume geocoding. Default public services have capacity/use limits. Searches are submit-only, browser-cached, and CDN-cached; no autocomplete requests are sent.

## Supabase setup — no user accounts
Fresh database:
1. Run supabase/migrations/001_initial.sql.
2. Run supabase/migrations/003_spatial_api.sql.

Existing v1 database:
1. Run supabase/migrations/002_remove_accounts.sql instead of rerunning the changed fresh-install script.
2. Run supabase/migrations/003_spatial_api.sql.

The upgrade preserves station/report history, removes application references to user identities and account-owned writes, and retires the 16 original sample station IDs. Supabase's platform-owned identity schema is not dropped. The application never calls that service.

PostGIS is installed in the extensions schema. If your existing PostGIS extension uses a different schema, adapt the qualified geometry/functions before applying the migration.

Configure server environment variables (copy .env.example to ignored .env.local for local work):
- SUPABASE_URL
- SUPABASE_ANON_KEY (or SUPABASE_PUBLISHABLE_KEY) for public read RPCs
- SUPABASE_SERVICE_ROLE_KEY for server-side validated report writes
- REPORT_RATE_LIMIT_SALT: a random server-side value, used only to hash a daily network rate-limit key

None of these variables has a VITE_ prefix; they are not sent to the browser. VITE_CARTO_API_KEY is intentionally a browser raster-tile key. No user credentials, accounts, anonymous-auth users, cookies, bearer sessions, or login tokens are created by the application.

## Spatial schema and endpoints
The stations.location geometry(Point,4326) column is generated from longitude/latitude and has a partial GiST index on active stations.

- viewport_envelopes(min_long,min_lat,max_long,max_lat) creates ST_MakeEnvelope(...,4326) polygons. Crossing the date line returns two envelopes.
- stations_in_view uses the index-aware && predicate, a stable ID cursor, and bounded pages. Per-station cached price JSON avoids repeated global latest-price scans and huge IN lists.
- station_clusters_in_view returns compact server-side overview clusters below zoom 8. Raw local results above that zoom are clustered again by the worker.
- GET /api/stations forwards the exact active map bounds and zoom, caches responses briefly, and returns cursor pages.
- GET /api/geocode resolves state names/codes locally or proxies a U.S.-restricted place search.
- POST /api/reports accepts a station ID, fuel, price, and optional nickname. It has no login requirement. Validation and a database-atomic rate limit protect the public write endpoint.
- submit_public_price is executable only by the server role, not arbitrary direct anonymous database clients. Visitors still submit without accounts.
- Report timestamps come from the database. Updates lock the station row before replacing its cached price.
- Direct public table writes are revoked. The rate-limit table is private and contains a daily salted hash, not a raw IP or user account. Expired keys can be removed with a database maintenance job.

A viewport page has at most 1,000 stations. The client follows cursors up to 50,000 raw points and explicitly labels a partial result if that bound is reached. Overview clusters prevent whole-country raw payloads. Filters affect rendered results; statistics use all fresh reports for the selected fuel inside the exact viewport.

## Import a genuine all-state catalog
Never use a synthetic generator for production station data.

Collect authorized U.S. state Overpass extracts with an elements array, named AL.json through WY.json (all 50 postal codes; DC.json optional). A typical state query is:
```text
[out:json][timeout:180];
area["ISO3166-2"="US-CA"]->.state;
nwr["amenity"="fuel"](area.state);
out center tags;
```
For production, obtain bulk extracts or run this against your appropriately provisioned provider rather than repeatedly burdening public instances.

```sh
node --env-file=.env.local scripts/import-stations.mjs /path/to/state-extracts
```
The importer checks that all 50 state files exist before writing, normalizes real OSM elements, and upserts in batches of 500. Use --allow-partial for an intentional incremental import. It does not invent prices, delete missing stations, or replace existing price fields. The input extracts must cover the stated U.S. state. Attribute OSM data under ODbL and follow the data provider's terms.

## Verification and limits
See VERIFICATION.md. Automated coverage includes viewport/date-line behavior, all state searches, API validation, anonymous reports, rate-limit responses, empty responses, stale prices, and tooltip escaping. The actual worker is benchmarked with a separately labeled 100,000-point synthetic fixture. It is never imported into the app.

The SQL scripts still require execution against a configured Supabase/PostGIS project. No production database connection or full national catalog has been provisioned in this workspace. Public directory coverage and prices are crowdsourced and not independently verified.

## Primary references
- https://supabase.com/docs/guides/database/extensions/postgis
- https://postgis.net/docs/ST_MakeEnvelope.html
- https://github.com/mapbox/supercluster
- https://vercel.com/docs/functions/runtimes/node-js
- https://operations.osmfoundation.org/policies/nominatim/
- https://wiki.openstreetmap.org/wiki/Overpass_API

Pinned Supercluster and KDBush upstream sources, provenance, and ISC licenses are in vendor/.

## Automated nationwide download and import

The downloader uses a sequential Overpass query for each of the 50 state boundaries plus DC, including Alaska. It requests nodes, ways, and relations with center coordinates. Configure OVERPASS_URL for a provider whose terms and capacity permit nationwide bulk queries; do not treat public fallback servers as a production bulk service. This pipeline accepts Overpass JSON, not Geofabrik PBF. An empty or partial extract fails instead of silently declaring a state complete. OSM coverage is crowdsourced and is not a completeness guarantee.

Add these server-only settings to ignored .env.local (never commit credentials):

```text
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-server-secret-key
OVERPASS_URL=your-authorized-provider-interpreter-url
```

Vercel Production variables do not automatically populate this local file. Keep its existing map configuration. Never use a VITE_ prefix for the server key.

From the project directory:

```powershell
npm run stations:sync
npm run verify:live
```

Download files are saved atomically in ignored data/station-extracts. Failed runs can resume using valid cached states; idempotent upserts allow safe reruns after interrupted batches. Four download attempts use exponential delays. Queries are sequential with a default 45-second gap. IMPORT_DELAY_MS can adapt the gap to provider requirements. IMPORT_STATES=NC limits the run to a deliberate partial import; leave unset for all states plus DC.

For a fresh directory snapshot, run:

```powershell
npm run stations:sync -- --refresh
```

Use that command for a daily externally scheduled background job after the first successful verified run, with credentials in its secret store, a single concurrent run, and failure alerts. This change does not create or enable a scheduler. Existing reported prices are preserved. Missing stations are not automatically deleted or retired: a later lifecycle process must reconcile closures safely. Cached files are reused indefinitely unless --refresh is supplied. New source data does not imply updated retail prices.

verify:live creates a uniquely identified, explicitly named test station, submits a report to the public API without auth headers, verifies the price through a live viewport read, and deletes the station with cascading reports in finally. It verifies the station deletion. SITE_URL can select another deployment; by default it uses pump-scout-nine.vercel.app. The test briefly exposes a clearly labeled test listing and consumes normal submission rate limits. Run once at a time; avoid interrupting it. If cleanup fails it exits with an error; the test rows have source=test and names beginning AUTOMATED TEST. No real station prices are changed. The normal daily rate-limit record is not removed.

Current execution status: local tests pass, but the nationwide import and live submission verification have not run successfully. Local server credentials and an authorized bulk endpoint are missing. No test station has been created.
