# PumpScout
Responsive React + TypeScript + Vite gas-price map. Tailwind CSS, Lucide icons, and a lifecycle-managed Leaflet React component. Default area: Raleigh, NC.

## Run
Requires Node 22.12+ (Node 24 recommended).
```sh
npm ci
npm run dev
npm test
npm run build
```
An interactive local demo works without credentials. The banner labels sample data clearly. Demo reports, reviews, optional photos, bookmarks, theme, and contributor profile persist in this browser. The sample station addresses and prices are illustrative and must not be treated as verified listings or current retail prices.

## Connect Supabase
1. Create a Supabase project.
2. Run `supabase/migrations/001_initial.sql` in its SQL editor once.
3. Import verified station listings into `public.stations`. `supabase/seed.sql` provides the demo Raleigh station catalog only; verify/correct it before production. It intentionally adds no price reports to the live database.
4. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and the public publishable/anon key in `VITE_SUPABASE_ANON_KEY`. Never use a service-role key in this frontend.
5. In Supabase Authentication URL Configuration, add your deployed origin and local origin (`http://127.0.0.1:5173`) to allowed redirect URLs. Enable email auth. The sign-in UI supports a magic link and an email OTP if your email template includes a code.
6. Restart Vite, or set the two variables on your hosting project and rebuild.
When configured, the app loads ONLY shared database records. It does not silently fall back to sample data when a live request fails. Errors have a retry action.

Supabase integration uses its official Auth, PostgREST, Storage, and Realtime HTTP/WebSocket interfaces directly, without a bundled SDK. Auth refreshes before API calls; reports refresh through Postgres Changes, with a 45-second polling fallback. Sessions persist on the device. The frontend public key does not authorize writes; row-level security requires a signed-in author.

## Database security
- Public read-only station catalog; no client station insertion or modification.
- Append-only price reports. The database checks the author, allowed fuel, price bounds, handle, and photo ownership prefix.
- A database trigger supplies report timestamps and serializes/throttles reports to one per account per 30 seconds.
- One review per signed-in account per station; authors can update their own review only.
- Price photos use a private 5 MB JPEG/PNG bucket, scoped to the uploader.
- The latest-price view uses invoker security and exposes no email or photo path.
- No service-role secrets, admin endpoints, or client write access to seed data.

Before a public launch, test the migration against a fresh Supabase project and test two separate users for cross-account writes and private photo access. Those integration tests require a configured project. Account-level rate limiting is not a substitute for abuse monitoring or moderation.

## Map and search
Leaflet loads lazily and is removed cleanly on unmount. CARTO Voyager tiles use the browser basemap key in VITE_CARTO_API_KEY. The key is configured outside tracked source. Raster browser keys are visible in browser tile requests. Without a key, or if CARTO requests fail, the map uses key-free OpenStreetMap tiles. Muted, full-color, and dark map treatments are available. Attribution remains visible. External tile outages show an error without breaking the station list.

Location search uses submit-only Nominatim, caches successful searches locally, limits requests to at most one per 1.1 seconds per browser, restricts to the U.S., and times out with a useful message. It does not send autocomplete requests. Set `VITE_GEOCODER_URL` to a compatible provider endpoint for higher traffic; a production multi-user deployment needs an appropriate hosted/self-hosted provider or shared proxy to meet provider rate limits. Precise geolocation is used locally to center the map, not stored in a user profile.

Markers compare fresh (under 24h) local prices: lowest 20% green, highest 20% red, the remainder yellow. Ties share a tier. Local statistics use all fresh prices in the search radius; membership and saved-only filters affect results, not that local baseline. Savings use the local average minus the lowest price, for 15 gallons. Prices are cash USD/gallon; they are crowdsourced, not independently verified.

## Deploy
The production output is `dist/`. Sites metadata is in `.openai/hosting.json`; the Vercel configuration is in `vercel.json`. The same source can be pushed to a new GitHub repository and imported into Vercel. Supabase browser environment variables are baked into each frontend build, so rebuild after changing them.

## Verification
`npm test` checks geographic distances, percentile ties, report validation, stale prices, empty averages, tooltip escaping, and successful empty HTTP write responses. `npm run build` runs strict TypeScript checking and a production build. See `VERIFICATION.md` for environment-specific results and remaining integration checks.

