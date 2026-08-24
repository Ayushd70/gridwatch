# Putting Gridwatch on gridwatch.ayushd70.dev

ayushd70.dev itself stays on GitHub Pages. Gridwatch gets a subdomain so the two don't fight over DNS.

## 1. Vercel project

Import `Ayushd70/gridwatch` from GitHub (or `npx vercel --prod` from this folder). Framework: Next.js. Leave `NEXT_PUBLIC_INGEST_WS` unset.

Optional env vars:

- `OPENF1_USERNAME` / `OPENF1_PASSWORD` — only if you sponsored OpenF1 and want live REST during a session.

## 2. DNS

Domain is on Google Domains nameservers (`ns-cloud-d*.googledomains.com`), which now live in the Squarespace/Google Domains DNS UI.

Add one record:

- Host: `gridwatch`
- Type: `CNAME`
- Value: `cname.vercel-dns.com`

Wait for it to resolve (`dig gridwatch.ayushd70.dev CNAME`), then in Vercel → Project → Settings → Domains add `gridwatch.ayushd70.dev`.

The apex `A` records for ayushd70.dev should stay pointed at GitHub Pages (`185.199.x.x`).

## 3. What production does not do

No MQTT, no always-on WebSocket. Timing refreshes about every 30s from OpenF1 REST. Podium picks are stored in the browser (Vercel has no writable disk).
