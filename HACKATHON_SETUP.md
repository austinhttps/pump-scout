# Hackathon setup

Implemented: a separate EIA weekly regular-gasoline benchmark with national and five regional selectors, and an opt-in Raleigh demo with six fictional stations and sample prices. Existing community reporting stays available in live mode. Missing real prices remain blank. Demo reporting and directions are disabled; sample data never goes to Supabase or browser report storage.

## 1. Get your free EIA key

Register at https://www.eia.gov/opendata/register.php and copy the key delivered by email.

## 2. Configure your computer

Open the existing .env.local in the pump-scout folder. Preserve its existing entries and add:

EIA_API_KEY=your_actual_key

Do not add a VITE_ prefix or commit this file.

## 3. Run locally

In Windows PowerShell:

```powershell
cd "C:\Users\Austi\OneDrive\CodingProjects\GPT\gas price map\pump-scout"
npm install
npm run dev
```

Open the localhost URL printed by Vite. Restart the dev server after changing environment variables. The preview command serves static files only; use npm run dev for local API requests.

## 4. Check the features

1. Confirm the EIA panel shows a price, selected region, and week date. Change regions. It is always regular gasoline, independent of the station fuel filter.
2. Choose Try sample-price demo. Six fictional Raleigh stations should appear with sample prices and an orange demo banner.
3. Try sorting, fuel filters, and station details. Report a price should explain that sample mode is read-only.
4. Exit demo mode. Confirm real station data returns and unreported stations remain blank.
5. Search your actual demo city. Collect genuine observed prices at several stations using Report a price. Check payment conditions and report only prices you observed.
6. Test mobile layout and pan the map. Reloading always exits demo mode.
7. Without an EIA key or if EIA fails, the panel should show an unavailable message; map and reports should continue working.

## 5. Configure Vercel

Open your existing Vercel project > Settings > Environment Variables. Add EIA_API_KEY for Production (and Preview if desired). Keep it server-only. Redeploy after saving. No new database migration or GitHub Actions secret is needed for EIA.

## 6. Verify and publish your source

```powershell
npm test
npm run build
git status
git add .env.example api/averages.js server/dev-plugin.js src/App.tsx src/demo.ts src/components/EiaAverage.tsx src/components/StationCard.tsx src/components/StationDetails.tsx src/styles.css src/useViewportData.ts tests/averages.test.ts HACKATHON_SETUP.md
git commit -m "Add EIA benchmarks and isolated hackathon demo"
git push origin main
```

If Vercel is connected to main, the push triggers a deployment. Otherwise deploy through the existing project's normal workflow. Confirm the Production deployment succeeded and repeat the browser checks.

## Data behavior and limits

EIA updates are fetched on panel load/region selection. Vercel CDN caches successful responses for six hours; observations are weekly, not live pump prices. The endpoint returns only sanitized observations and never forwards upstream metadata containing the key. Regional averages do not fill missing station prices or enter station rankings.

No paid fuel feed is required. Existing map, database, hosting, and directory-provider quotas or charges still apply. The station-directory workflow is separate from fuel-price updates.

References:
- EIA registration: https://www.eia.gov/opendata/register.php
- EIA API documentation: https://www.eia.gov/opendata/documentation.php
- EIA gasoline survey: https://www.eia.gov/petroleum/gasdiesel/

Live EIA access and deployed browser behavior require verification after a real EIA key is configured.

