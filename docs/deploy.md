# Putting Gridwatch on gridwatch.ayushd70.dev

The site is already live there. ayushd70.dev itself stays on GitHub Pages. Gridwatch is only the subdomain so the two don't fight over DNS.

## 1. Vercel project

Import `Ayushd70/gridwatch` from GitHub, or from this folder:

```bash
npx vercel --prod
```

Framework: Next.js. Leave `NEXT_PUBLIC_INGEST_WS` unset. Don't upload `.env` — local ingest URLs would get baked into the client. `.vercelignore` already excludes it.

Optional env vars on the Vercel project:

- `OPENF1_USERNAME` / `OPENF1_PASSWORD` — only if you sponsored OpenF1 and want live REST during a session.

CLI deploys work without linking GitHub. Automatic deploys on push need a GitHub login connection in the Vercel account, then Project → Settings → Git.

## 2. DNS (Squarespace)

The domain came from Google Domains. Nameservers still look like `ns-cloud-d*.googledomains.com`; you edit records in Squarespace, not in a Squarespace *website*.

1. Open [account.squarespace.com/domains](https://account.squarespace.com/domains)
2. Sign in with **Continue with Google** if that's how the Google Domains account worked
3. Click **ayushd70.dev** → **DNS** → **DNS Settings**
4. **Custom Records** → **Add record** (password / 2FA)
5. Save this, then nothing else:

| Field | Value |
| --- | --- |
| Type | `CNAME` |
| Name / Host | `gridwatch` (not the full hostname) |
| Data | `cname.vercel-dns.com` |
| TTL | default |

Do not change nameservers. Do not use Squarespace's Vercel DNS preset (it would also point the apex at Vercel and take the portfolio down). Do not edit the apex `A` records (`185.199.x` → GitHub Pages) or `www`.

Then in Vercel → Project → Settings → Domains add `gridwatch.ayushd70.dev`. SSL shows up once the CNAME resolves.

## 3. What production does not do

No MQTT, no always-on WebSocket. Timing refreshes about every 30s from OpenF1 REST. Podium picks are stored in the browser (Vercel has no writable disk).
