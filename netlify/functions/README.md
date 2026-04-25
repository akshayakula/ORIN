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
  "env": { "firms": true, "demo": false }
}
```

---

## `GET /.netlify/functions/firms`

Fetches NASA FIRMS thermal detections for a 1°×1° bbox centered on `(lat, lng)`. Falls back to deterministic mock data on any upstream failure, so the UI never breaks.

**Query params**
| name | required | notes |
| --- | --- | --- |
| `lat` | yes | `[-90, 90]` |
| `lng` | yes | `[-180, 180]` |
| `days` | no | integer `[1, 10]`, default `7` |
| `sources` | no | one of `VIIRS_SNPP_NRT` (default), `VIIRS_NOAA20_NRT`, `MODIS_NRT`. Invalid values default silently. |

**Response 200**
```json
{
  "detections": [ { "latitude": 29.76, "longitude": -95.37, "bright_ti4": 324, "acq_date": "2026-04-22", "acq_time": "1830", "satellite": "VIIRS_SNPP_NRT", "confidence": "n", "frp": 7, "daynight": "N" } ],
  "count": 1,
  "scanDays": 7,
  "bbox": { "west": -95.87, "south": 29.26, "east": -94.87, "north": 30.26 },
  "status": "low-activity",
  "statusLabel": "Low activity signal",
  "source": "live",
  "source_sensor": "VIIRS_SNPP_NRT",
  "fetchedAt": "2026-04-24T18:00:00.000Z"
}
```

**Response 400** — malformed `lat`/`lng` or out-of-range `days`.

**Guardrails**
- 60s in-memory cache per `(bbox, days, sensor)`.
- Warm-container rate limit: > 30 hits to the same bucket in 10 min serves cached / mock.
- MAP_KEY is never echoed in logs or responses.

---

## `GET /.netlify/functions/listings`

Returns 2 seeded seller listings + anything POSTed during the warm container's lifetime.

**Response 200**
```json
{ "count": 2, "listings": [ { "id": "ORIN-D4-SELLER-SEED001", "...": "..." } ] }
```

## `POST /.netlify/functions/listings`

Submit a new seller listing. Computes a preliminary ORIN risk score and grade.

**Body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "company": "Acme Biofuels",
  "facility": "Acme Biofuels — Houston",
  "dCode": "D4",
  "type": "Biomass-based Diesel",
  "quantity": 100000,
  "vintage": 2025,
  "price": 1.21,
  "lat": 29.76,
  "lng": -95.37,
  "city": "Houston, TX",
  "qapProvider": "EcoEngineers",
  "qapStatus": "Verified"
}
```

Validation:
- `email` must match a simple regex.
- `dCode` ∈ `[D3, D4, D5, D6, D7]`.
- `quantity > 0`, `price > 0`, `vintage ∈ [2020, 2030]`.
- `lat ∈ [-90, 90]`, `lng ∈ [-180, 180]`.

Risk rules (matching the client hook):
- `qapStatus`: Verified→22, Partial→55, Missing→72, Pending→45.
- `+10` if `price < 0.50`, `+8` if `quantity > 1_000_000`.

**Response 201**
```json
{ "listing": { "id": "ORIN-D4-SELLER-A1B2C3", "riskScore": 22, "orinGrade": "A", "satelliteStatus": "Pending ORIN satellite review", "recommendation": "Pending ORIN Integrity Audit", "source": "seller", "createdAt": "..." } }
```

**Response 400**
```json
{ "errors": [ { "field": "email", "message": "email must be a valid address." } ] }
```

---

## `POST /.netlify/functions/audit`

Runs a server-side audit packet for a lot, enriched with live FIRMS data (via the same `runFirms` helper used by `/firms`).

**Body**
```json
{ "lotId": "ORIN-D4-XYZ", "lat": 29.76, "lng": -95.37, "days": 7, "sensor": "VIIRS_SNPP_NRT" }
```

**Response 200**
```json
{
  "lotId": "ORIN-D4-XYZ",
  "firms": { "count": 1, "status": "low-activity", "source": "live", "source_sensor": "VIIRS_SNPP_NRT", "...": "..." },
  "generatedAt": "2026-04-24T18:00:00.000Z",
  "scanWindowDays": 7,
  "summary": "Lot ORIN-D4-XYZ: scanned 7-day window via VIIRS_SNPP_NRT (live). Low activity signal. 1 low-intensity detection(s) — within expected bounds."
}
```

**Response 400** — missing/invalid `lotId`, `lat`, `lng`, or `days`.
