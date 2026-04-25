# ORIN Netlify Functions

All endpoints live under `/.netlify/functions/*` (also reachable via the `/api/*` rewrite in `netlify.toml`). All responses are JSON unless stated. CORS is open (`*`) and OPTIONS preflight is handled.

## `GET /.netlify/functions/health`

Liveness / env probe.

**Response 200**
```json
{
  "ok": true,
  "service": "orin",
  "time": "2026-04-24T18:00:00.000Z",
  "version": "0.1.0",
  "env": { "demo": false }
}
```

---

## `GET /.netlify/functions/listings`

Returns the full marketplace catalog from Upstash (demo + seller listings).

**Response 200**
```json
{ "listings": [ { "id": "ORIN-D4-SELLER-SEED001", "...": "..." } ], "serverTime": "..." }
```

## `POST /.netlify/functions/listings`

Submit a new seller listing. The body must include `id`, `lat`, `lng`, `dCode`, `quantity`, `price`, `seller`, `facility`, `city`. Stored to Upstash as `orin:listing:<id>` with the id added to set `orin:listings:set`.

**Response 201** — `{ "listing": { ... } }`

## `POST /.netlify/functions/listings/seed`

Idempotently seeds the curated 22-lot demo catalog into Upstash. Skips IDs that already exist.

**Response 200** — `{ "inserted": <n>, "skipped": <m> }`

## `DELETE /.netlify/functions/listings/:id`

Deletes a single listing.

## `DELETE /.netlify/functions/listings`

Deletes every listing.

---

## `GET /.netlify/functions/airquality`

Proxies Google Air Quality API. Query: `lat`, `lng`. Server-side `GOOGLE_API_KEY` (or `VITE_GOOGLE_MAPS_API_KEY`) used; key never echoed.

## `GET /.netlify/functions/auctions` / `POST /.netlify/functions/auctions`

Live auction board, backed by Upstash. See source for shape.

## `POST /.netlify/functions/crustdata`

Server-side Crustdata enrichment proxy.
