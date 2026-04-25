# ORIN Netlify Functions — Test Plan

The functions live in `netlify/functions/`. As of this audit, only `firms.ts` and `health.ts` exist; `listings` and `audit` are planned but not implemented. Tests for those are drafted in advance so the backend author can run them immediately after commit.

Base URL locally: `http://localhost:8888/.netlify/functions` (Netlify Dev default).

> No dev server was running when this report was written, so no live integration tests were executed against our own functions.

## 1. `health` (implemented)

### 1.1 Happy path
- **Method:** GET
- **Path:** `/health`
- **Expected status:** 200
- **Expected body shape:**
  ```json
  { "ok": true, "service": "orin", "time": "...", "version": "0.1.0",
    "env": { "firms": true|false, "demo": true|false } }
  ```
- **Edge:** `env.firms` must reflect `NASA_FIRMS_MAP_KEY` presence only (boolean, never leak value).

### 1.2 CORS preflight
- **Method:** OPTIONS
- **Expected:** 204, `Access-Control-Allow-Origin: *`.

## 2. `firms` (implemented)

### 2.1 Happy path — Houston
- **Method:** GET
- **Path:** `/firms?lat=29.7604&lng=-95.3698&days=3&sensor=VIIRS_NOAA20_NRT`
- **Expected status:** 200
- **Expected body:**
  ```json
  { "detections": [...], "count": N, "scanDays": 3,
    "bbox": { "west": -95.87, "south": 29.26, "east": -94.87, "north": 30.26 },
    "status": "no-anomaly"|"low-activity"|"review-recommended",
    "statusLabel": "...",
    "source": "live"|"mock",
    "source_sensor": "VIIRS_NOAA20_NRT",
    "fetchedAt": "..." }
  ```
- **Edge:** when key present, `source` SHOULD be `"live"`. If it's `"mock"`, upstream or validation is broken.

### 2.2 No detections — SF 1-day
- **Path:** `/firms?lat=37.7749&lng=-122.4194&days=1`
- **Expected:** 200, `count=0`, `status="no-anomaly"`, `statusLabel="No thermal anomaly detected"`.

### 2.3 Missing params
- **Path:** `/firms`
- **Expected:** 400, body `{ error: "Missing or invalid lat/lng query parameters.", example: "..." }`.

### 2.4 Out-of-range lat/lng
- **Path:** `/firms?lat=99&lng=-200`
- **Expected:** 400.

### 2.5 Days out of range
- **Path:** `/firms?lat=29.7&lng=-95.3&days=99`
- **Expected:** 400, body says days must be in [1,10].
- **Known bug:** the 1..10 upper bound is too loose — NASA caps at 5. Days 6..10 cause a silent fallback to mock.

### 2.6 Sensor alias
- **Path:** `/firms?lat=29.7&lng=-95.3&days=3&sources=modis_nrt`
- **Expected:** 200 with `source_sensor=MODIS_NRT` (case-insensitive, both `sensor` and `sources` accepted).

### 2.7 Unknown sensor
- **Path:** `/firms?lat=29.7&lng=-95.3&days=3&sensor=GARBAGE`
- **Expected:** 200 with `source_sensor=VIIRS_SNPP_NRT` (silent normalization).

### 2.8 Cache hit
- Repeat 2.1 twice back-to-back. Second call should return identical payload within the same warm container.

### 2.9 OPTIONS preflight
- **Method:** OPTIONS
- **Expected:** 204 with CORS headers.

## 3. `listings` (NOT implemented)

Planned shape inferred from `src/` RIN data types.

### 3.1 GET all
- **Path:** `/listings`
- **Expected:** 200 `{ listings: [...] }`.

### 3.2 GET by id
- **Path:** `/listings?id=RIN-...`
- **Expected:** 200 single listing or 404.

### 3.3 POST new listing
- **Method:** POST, JSON body `{ fuelCode, volume, lat, lng, ... }`
- **Expected:** 201, `{ id, ...input, createdAt }`.
- **Edge:** validate fuelCode ∈ D3..D7, volume > 0.

## 4. `audit` (NOT implemented)

### 4.1 POST `/audit`
- Body `{ lat, lng, rinId, days? }`.
- Orchestrates: EPA reference lookup → FIRMS scan → returns combined attestation object.
- **Expected:** 200 with `{ rinId, firms, referencePrice, verdict }`.
- **Edge:** invalid rinId → 404; FIRMS upstream down → returns verdict anyway with `firms.source="mock"` and a warning.

## 5. CORS + Method tests (all functions)

- OPTIONS returns 204.
- POST on GET-only endpoints returns 405 (currently the function just runs anyway — consider adding method guard).

## 6. Secret leakage

- No response, log, or error body should contain the MAP_KEY substring. `firms.ts` `sanitize` handles thrown errors but not 400 body pass-through (currently no pass-through exists — good).

## 7. Running the tests

Use `scripts/smoke.sh` from the repo root once `netlify dev` is running:

```bash
netlify dev &
sleep 5
./scripts/smoke.sh
```

The script is a self-contained set of curl one-liners with pass/fail assertions based on HTTP status only. For deeper payload assertions, pipe `jq` over the body.
