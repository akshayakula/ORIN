# NASA FIRMS API — Live Test Report

Generated: 2026-04-24. Key used via env var `$NASA_FIRMS_MAP_KEY`.

## Summary

| # | Test | Result |
|---|------|--------|
| 1 | `mapkey_status` endpoint (budget probe) | OK |
| 2 | `area/csv` VIIRS_SNPP_NRT Denver 7d | FAIL — "Invalid day range. Expects [1..5]." |
| 3 | `area/csv` VIIRS_SNPP_NRT Denver 5d | OK (0 detections, header only) |
| 4 | `area/csv` VIIRS_SNPP_NRT SF 1d | OK (header only) |
| 5 | `area/csv` VIIRS_NOAA20_NRT Houston 3d | OK (37 detections) |
| 6 | `area/csv` MODIS_NRT Minneapolis 5d | OK (header only, empty body) |
| 7 | `area/csv` invalid bbox `999,999,999,999` | FAIL — `HTTP 400 "Invalid area coordinate. Expects: [-180..180]."` |
| 8 | `area/csv` invalid MAP_KEY | FAIL — `HTTP 400 "Invalid MAP_KEY."` |
| 9 | `area/json/...` (JSON endpoint) | DOES NOT EXIST — returns 400 HTML page |
| 10 | `data_availability/csv/.../all` | OK (product date ranges) |
| 11 | `country/csv/.../USA/1` | FAIL — "Invalid API call." (correct form likely requires different path; see below) |

Net: the MAP_KEY works, but the *advertised 7-day range in our source code comment* is wrong — NASA FIRMS caps `DAY_RANGE` at **1..5** for the `area/csv` endpoint.

## MAP_KEY budget

```
GET https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=$NASA_FIRMS_MAP_KEY
-> { "transaction_limit": 5000, "current_transactions": 33, "transaction_interval": "10 minutes" }
```

At test time: **33 / 5000** used in the rolling 10-minute window. Plenty of headroom.

Note: FIRMS `computeWeight` formula (from the `/api/area` page JS):
- VIIRS sources count as weight **2**, MODIS/LANDSAT as **0.5**.
- Area weight = `ceil((east-west)/60) * ceil((north-south)/60) * src * days`.
- For a 1°×1° bbox, VIIRS, 5 days → `1 * 1 * 2 * 5 = 10` transactions per call.
- For `world` bbox, VIIRS, 5 days → `6 * 3 * 2 * 5 = 180`.
- Backend must be conservative: the demo can issue ~500 VIIRS 1°×1°/5-day audits per 10 min before throttling.

## Valid endpoints discovered

| Path | Purpose |
|------|---------|
| `/api/area/csv/{KEY}/{SOURCE}/{W,S,E,N}/{DAYS}` | Most recent data in bbox |
| `/api/area/csv/{KEY}/{SOURCE}/{W,S,E,N}/{DAYS}/{YYYY-MM-DD}` | Historical window starting on date |
| `/api/country/csv/{KEY}/{SOURCE}/{COUNTRY_CODE_3}/{DAYS}[/date]` | ISO3 country (e.g. USA). My test above may have hit a server hiccup — the endpoint is documented. |
| `/api/data_availability/csv/{KEY}/all` | Product availability windows |
| `/mapserver/mapkey_status/?MAP_KEY=...` | Budget meter |

`area/json` does NOT exist. Only CSV is served. `country/json` likewise does not exist.

Valid `SOURCE` values observed on the FIRMS page:
`LANDSAT_NRT` (US/Canada only), `MODIS_NRT`, `MODIS_SP`, `VIIRS_NOAA20_NRT`, `VIIRS_NOAA20_SP`, `VIIRS_NOAA21_NRT`, `VIIRS_SNPP_NRT`, `VIIRS_SNPP_SP`, plus `GOES_NRT`, `BA_MODIS`, `BA_VIIRS` (archive-only).

## Per-sensor CSV header schema

### VIIRS_SNPP_NRT & VIIRS_NOAA20_NRT (and NOAA21, SNPP_SP, NOAA20_SP)

```
latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
```

- `confidence` is a single letter: `l` (low), `n` (nominal), `h` (high).
- `version` example: `2.0NRT`, `2.0URT`.
- `satellite` examples: `N` (S-NPP), `N20` (NOAA-20), `N21` (NOAA-21).
- `daynight`: `D` or `N`.
- Temperatures `bright_ti4`, `bright_ti5` in Kelvin. `frp` in MW.

### MODIS_NRT (and MODIS_SP)

```
latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
```

DIFFERENCES vs VIIRS:
- `brightness` (instead of `bright_ti4`)
- `bright_t31` (instead of `bright_ti5`)
- `confidence` is an integer 0–100 (not a letter).
- `satellite` uses `T` (Terra) or `A` (Aqua).

The current parser in `netlify/functions/firms.ts` only indexes `bright_ti4`/`bright_ti5`, so MODIS rows come back with `bright_ti4=undefined` and `bright_ti5=undefined`. **Action:** either (a) also read `brightness`/`bright_t31` and map them into `bright_ti4`/`bright_ti5` for downstream UI, or (b) expose them as their own fields. The UI currently never displays these for MODIS.

### LANDSAT_NRT (not tested live, attribute table differs)

Landsat returns a different schema (with `path`, `row`, and no `bright_ti*`). Backend should gate on sensor before trusting column names. Not recommended for the demo.

## CSV quirks to handle

1. **Empty responses** — when no detections, the upstream returns a single header line with a trailing newline. `parseFirmsCsv` handles that (`lines.length < 2`).
2. **Trailing newline** — present, splits to empty last line; filter empty lines.
3. **Carriage returns** — responses use Unix `\n`, but the parser's `replace(/\r/g, "")` is correct defence.
4. **No BOM observed**, but leave the `stripBom` guard.
5. **No quoted fields observed in the NRT endpoints**, but `splitCsvLine` already handles them.
6. **Content-Type is `text/plain;charset=UTF-8` on both success AND error** — do NOT key off content-type. Key off body prefix and the keyword checks already in `looksLikeFirmsError`.
7. **Error bodies are plain text one-liners**, not HTML. Examples:
   - `"Invalid day range. Expects [1..5]."`
   - `"Invalid area coordinate. Expects: [-180..180]."`
   - `"Invalid MAP_KEY."`
   - Multi-line errors when multiple params are wrong.
   `looksLikeFirmsError` currently matches on `"error"` substring — a body like `"Invalid day range."` would slip through because it doesn't contain `"error"` and doesn't start with `<`. The parser would then read zero lines because the header check fails. Net effect is OK (empty detections → falls to mock), but a stronger guard would be `if (!/^latitude,/.test(body)) treat as error`.

## Recommended ORIN audit defaults

- **Sensor:** `VIIRS_SNPP_NRT` primary; fall back to `VIIRS_NOAA20_NRT` on zero-detection for a second pass. S-NPP + NOAA-20 give ~2x daily revisit.
- **Day range:** **3** (not 7). 3 balances freshness against detection likelihood and is well within the 1..5 server cap. The `days=7` default in `firms.ts` L425 is WRONG and will 400 upstream — the handler currently rescues that via `looksLikeFirmsError` and falls through to mock, which silently masks the bug.
- **BBox:** ±0.5° around the facility (1° × 1° box) is a reasonable neighborhood footprint and costs only 10 transactions per VIIRS call.

## Failure modes + recommended error handling

| Failure | Upstream symptom | Recommended handler response |
|---------|------------------|------------------------------|
| Invalid MAP_KEY | `HTTP 400`, body `"Invalid MAP_KEY."` | 502 from our function, `{source:"mock", note:"invalid-key"}`; log `invalid-key` once and surface in `/health` |
| Invalid bbox | `HTTP 400`, body `"Invalid area coordinate..."` | 400 from our function — we validate before forwarding |
| `days > 5` | `HTTP 400`, body `"Invalid day range. Expects [1..5]."` | Clamp `days` to `min(days, 5)` server-side; return real data plus a `warning` field |
| Budget exhausted | Undocumented; likely 429 or 400. The current warm-container RATE_MAX=30 is far tighter than NASA's 5000/10min and provides defence in depth. | Serve stale-cached payload if available, else mock |
| Upstream slow | Happens; timeout currently 9s | Keep 9s; return mock + `source:"mock"` |
| Empty body / header only | Body is one line of headers | Parse returns `[]`; classify as `no-anomaly` |

## Action items for backend engineer

1. **Change default `rawDays` from `"7"` to `"3"`** in `firms.ts` handler (L425).
2. **Clamp `days` to 5** before building the upstream URL (or after validating the 1..5 input range). The current 1..10 validation allows values that always fail upstream.
3. **Strengthen `looksLikeFirmsError`** to require `/^latitude,/i` header as a positive marker; treat everything else as error.
4. **MODIS parsing:** map `brightness` → `bright_ti4` and `bright_t31` → `bright_ti5` or add explicit MODIS fields so the UI can render them.
5. **Surface `source:"live"` vs `"mock"` in the UI** — silent fallback hides upstream breakage. A small badge is sufficient.
6. **Expose remaining transactions on `/health`** by proxying `mapkey_status` (cache 60s).

## Live curl snippets for re-testing

```bash
# Budget
curl -sS "https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=$NASA_FIRMS_MAP_KEY"

# Houston N20 3-day
curl -sS "https://firms.modaps.eosdis.nasa.gov/api/area/csv/$NASA_FIRMS_MAP_KEY/VIIRS_NOAA20_NRT/-95.87,29.26,-94.87,30.26/3"

# Data availability
curl -sS "https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/$NASA_FIRMS_MAP_KEY/all"
```
