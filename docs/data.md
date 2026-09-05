# Where the numbers come from

F1 doesn't ship a public developer API. Gridwatch uses two community feeds and keeps credentials on the server.

## OpenF1

Used for whatever is happening (or just happened) in a session: order, intervals, laps, stints, pits, weather, race control, and the in-race championship estimate.

- REST: `https://api.openf1.org/v1/`
- MQTT (live): `mqtts://mqtt.openf1.org:8883`
- Historical data is free. "Live" is roughly 30 minutes before a session until 30 minutes after, and that tier wants a sponsor login.
- Delay is usually a couple of seconds.

The ingest process (`server/index.ts`) logs in if `.env` has credentials, refreshes the token about every 50 minutes, and fans a single snapshot out over WebSocket. Browsers should not hit OpenF1 directly — you'll rate-limit yourself and leak the password.

If a session is live and you're not logged in, OpenF1 returns a lock message. Gridwatch shows that the live board is closed until the session ends and replay is free again.

## Jolpica

Used after the flag: driver/constructor standings, the calendar, race/qualifying/sprint results.

Base URL: `https://api.jolpi.ca/ergast/f1/`

This is the Ergast replacement. No key. I treat it as the source of truth once a race is classified.

## What I didn't use

`livetiming.formula1.com` / SignalR. It's unofficial, easy to break, and the FastF1 docs are pretty explicit that it's for recording, not a product feed.
