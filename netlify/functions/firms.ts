// Netlify Function: NASA FIRMS NRT thermal anomaly lookup for a bbox.
// Falls back to deterministic mock data when the upstream is unreachable or the
// MAP_KEY is missing — the demo UI must never break.

type Handler = (event: {
  queryStringParameters?: Record<string, string | undefined>;
  httpMethod?: string;
}) => Promise<{
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}>;

export interface Detection {
  latitude: number;
  longitude: number;
  bright_ti4?: number;
  bright_ti5?: number;
  scan?: number;
  track?: number;
  acq_date: string;
  acq_time: string;
  satellite?: string;
  confidence?: string;
  frp?: number;
  daynight?: string;
}

export interface Bbox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type FirmsStatus = "no-anomaly" | "low-activity" | "review-recommended";

export type FirmsSensor =
  | "VIIRS_SNPP_NRT"
  | "VIIRS_NOAA20_NRT"
  | "MODIS_NRT";

const ALLOWED_SENSORS: FirmsSensor[] = [
  "VIIRS_SNPP_NRT",
  "VIIRS_NOAA20_NRT",
  "MODIS_NRT",
];

export interface FirmsResponse {
  detections: Detection[];
  count: number;
  scanDays: number;
  bbox: Bbox;
  status: FirmsStatus;
  statusLabel: string;
  source: "live" | "mock";
  source_sensor: FirmsSensor;
  fetchedAt: string;
}

// ---- CORS / header helpers ----------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonHeaders(source: "live" | "mock"): Record<string, string> {
  return {
    ...CORS_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control":
      source === "live" ? "public, max-age=300" : "public, max-age=60",
  };
}

// ---- Simple warm-container cache ---------------------------------------------

interface CacheEntry {
  expires: number;
  payload: FirmsResponse;
}
const CACHE_TTL_MS = 60_000;
const cache: Map<string, CacheEntry> = new Map();

// ---- Rate-limit guard (warm-container only) ----------------------------------

interface RateEntry {
  windowStart: number;
  count: number;
}
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 30;
const rateMap: Map<string, RateEntry> = new Map();

function bumpRate(key: string, now: number): boolean {
  const existing = rateMap.get(key);
  if (!existing || now - existing.windowStart > RATE_WINDOW_MS) {
    rateMap.set(key, { windowStart: now, count: 1 });
    return false;
  }
  existing.count += 1;
  return existing.count > RATE_MAX;
}

// ---- Structured log ----------------------------------------------------------

function logEvent(entry: {
  stage: "validate" | "fetch" | "parse" | "ok" | "ratelimit" | "cache";
  ms: number;
  count?: number;
  source?: "live" | "mock";
  sensor?: string;
  note?: string;
}): void {
  // Single-line structured log — never includes the map key.

  console.log(JSON.stringify({ fn: "firms", ...entry }));
}

// ---- Status classification ----------------------------------------------------

function classify(count: number): { status: FirmsStatus; statusLabel: string } {
  if (count <= 0) {
    return { status: "no-anomaly", statusLabel: "No thermal anomaly detected" };
  }
  if (count <= 3) {
    return { status: "low-activity", statusLabel: "Low activity signal" };
  }
  return {
    status: "review-recommended",
    statusLabel: "Thermal / flare review recommended",
  };
}

// ---- CSV parsing --------------------------------------------------------------

function stripBom(s: string): string {
  if (s.charCodeAt(0) === 0xfeff) return s.slice(1);
  return s;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        buf += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  out.push(buf);
  return out.map((f) => f.trim());
}

function toNum(v: string | undefined): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseFirmsCsv(csv: string): Detection[] {
  const clean = stripBom(csv).replace(/\r/g, "");
  const lines = clean.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());

  const idx = (key: string): number => header.indexOf(key);
  const iLat = idx("latitude");
  const iLng = idx("longitude");
  const iBt4 = idx("bright_ti4");
  const iBt5 = idx("bright_ti5");
  const iScan = idx("scan");
  const iTrack = idx("track");
  const iDate = idx("acq_date");
  const iTime = idx("acq_time");
  const iSat = idx("satellite");
  const iConf = idx("confidence");
  const iFrp = idx("frp");
  const iDn = idx("daynight");

  const detections: Detection[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cols = splitCsvLine(lines[li]);
    if (cols.length < 2) continue;
    const lat = toNum(cols[iLat]);
    const lng = toNum(cols[iLng]);
    if (lat == null || lng == null) continue;
    detections.push({
      latitude: lat,
      longitude: lng,
      bright_ti4: iBt4 >= 0 ? toNum(cols[iBt4]) : undefined,
      bright_ti5: iBt5 >= 0 ? toNum(cols[iBt5]) : undefined,
      scan: iScan >= 0 ? toNum(cols[iScan]) : undefined,
      track: iTrack >= 0 ? toNum(cols[iTrack]) : undefined,
      acq_date: iDate >= 0 ? cols[iDate] ?? "" : "",
      acq_time: iTime >= 0 ? cols[iTime] ?? "" : "",
      satellite: iSat >= 0 ? cols[iSat] : undefined,
      confidence: iConf >= 0 ? cols[iConf] : undefined,
      frp: iFrp >= 0 ? toNum(cols[iFrp]) : undefined,
      daynight: iDn >= 0 ? cols[iDn] : undefined,
    });
  }
  return detections;
}

// ---- Mock generator -----------------------------------------------------------

function mockFirms(
  lat: number,
  lng: number,
  days: number,
  bbox: Bbox,
  sensor: FirmsSensor,
): FirmsResponse {
  const seed = Math.abs(Math.sin(lat * lng));
  const count = Math.max(0, Math.round(seed * 6 - 1));
  const detections: Detection[] = Array.from({ length: count }).map((_, i) => ({
    latitude: lat + Math.sin(i * 1.3) * 0.18,
    longitude: lng + Math.cos(i * 1.3) * 0.18,
    bright_ti4: 320 + i * 4,
    bright_ti5: 290 + i * 3,
    scan: 0.45,
    track: 0.42,
    acq_date: new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10),
    acq_time: "1830",
    satellite: sensor,
    confidence: i % 2 === 0 ? "n" : "h",
    frp: 5 + i,
    daynight: "N",
  }));
  const { status, statusLabel } = classify(detections.length);
  return {
    detections,
    count: detections.length,
    scanDays: days,
    bbox,
    status,
    statusLabel,
    source: "mock",
    source_sensor: sensor,
    fetchedAt: new Date().toISOString(),
  };
}

// ---- Sanitization -------------------------------------------------------------

function sanitize(s: string, mapKey: string | undefined): string {
  if (!s) return s;
  if (!mapKey) return s;
  return s.split(mapKey).join("***");
}

function looksLikeFirmsError(body: string): boolean {
  const b = body.trim().toLowerCase();
  if (!b) return true;
  if (b.startsWith("<")) return true;
  if (b.includes("invalid map_key")) return true;
  if (b.includes("invalid mapkey")) return true;
  if (b.includes("map_key")) return true;
  if (b.includes("error")) {
    if (!b.includes("latitude")) return true;
  }
  return false;
}

function normalizeSensor(raw: string | undefined): FirmsSensor {
  if (!raw) return "VIIRS_SNPP_NRT";
  const up = raw.trim().toUpperCase();
  const hit = ALLOWED_SENSORS.find((s) => s === up);
  return hit ?? "VIIRS_SNPP_NRT";
}

// ---- Pure runner (also used by audit.ts) -------------------------------------

export async function runFirms(
  lat: number,
  lng: number,
  days: number,
  sensor: FirmsSensor = "VIIRS_SNPP_NRT",
): Promise<FirmsResponse> {
  const start = Date.now();
  const bbox: Bbox = {
    west: lng - 0.5,
    south: lat - 0.5,
    east: lng + 0.5,
    north: lat + 0.5,
  };
  const cacheKey = `${bbox.west.toFixed(4)}|${bbox.south.toFixed(4)}|${bbox.east.toFixed(4)}|${bbox.north.toFixed(4)}|${days}|${sensor}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && cached.expires > now) {
    logEvent({
      stage: "cache",
      ms: Date.now() - start,
      count: cached.payload.count,
      source: cached.payload.source,
      sensor,
    });
    return cached.payload;
  }

  // Rate-limit guard: too many unique hits to same bucket → serve cached or mock.
  if (bumpRate(cacheKey, now)) {
    logEvent({ stage: "ratelimit", ms: Date.now() - start, sensor });
    if (cached) return cached.payload;
    const payload = mockFirms(lat, lng, days, bbox, sensor);
    cache.set(cacheKey, { expires: now + CACHE_TTL_MS, payload });
    return payload;
  }

  const mapKey = process.env.NASA_FIRMS_MAP_KEY;
  if (!mapKey) {
    const payload = mockFirms(lat, lng, days, bbox, sensor);
    cache.set(cacheKey, { expires: now + CACHE_TTL_MS, payload });
    logEvent({
      stage: "ok",
      ms: Date.now() - start,
      count: payload.count,
      source: "mock",
      sensor,
      note: "no-map-key",
    });
    return payload;
  }

  const url =
    `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}` +
    `/${sensor}/${bbox.west},${bbox.south},${bbox.east},${bbox.north}/${days}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      logEvent({
        stage: "fetch",
        ms: Date.now() - start,
        sensor,
        note: `upstream-${res.status}`,
      });
      const payload = mockFirms(lat, lng, days, bbox, sensor);
      cache.set(cacheKey, { expires: now + CACHE_TTL_MS, payload });
      return payload;
    }

    const text = await res.text();
    if (looksLikeFirmsError(text)) {
      logEvent({
        stage: "parse",
        ms: Date.now() - start,
        sensor,
        note: "error-body",
      });
      const payload = mockFirms(lat, lng, days, bbox, sensor);
      cache.set(cacheKey, { expires: now + CACHE_TTL_MS, payload });
      return payload;
    }

    const detections = parseFirmsCsv(text);
    const { status, statusLabel } = classify(detections.length);
    const payload: FirmsResponse = {
      detections,
      count: detections.length,
      scanDays: days,
      bbox,
      status,
      statusLabel,
      source: "live",
      source_sensor: sensor,
      fetchedAt: new Date().toISOString(),
    };
    cache.set(cacheKey, { expires: now + CACHE_TTL_MS, payload });
    logEvent({
      stage: "ok",
      ms: Date.now() - start,
      count: detections.length,
      source: "live",
      sensor,
    });
    return payload;
  } catch (err) {
    const msg = sanitize(
      err instanceof Error ? err.message : String(err),
      mapKey,
    );
    logEvent({
      stage: "fetch",
      ms: Date.now() - start,
      sensor,
      note: `exception:${msg.slice(0, 80)}`,
    });
    const payload = mockFirms(lat, lng, days, bbox, sensor);
    cache.set(cacheKey, { expires: now + CACHE_TTL_MS, payload });
    return payload;
  }
}

// ---- Handler ------------------------------------------------------------------

export const handler: Handler = async (event) => {
  const t0 = Date.now();
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const qs = event.queryStringParameters ?? {};
  const rawLat = qs.lat;
  const rawLng = qs.lng;
  const rawDays = qs.days ?? "3";
  const sensor = normalizeSensor(qs.sources ?? qs.sensor);

  const lat = Number(rawLat);
  const lng = Number(rawLng);
  const days = Math.floor(Number(rawDays));

  if (
    rawLat == null ||
    rawLng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    logEvent({ stage: "validate", ms: Date.now() - t0, note: "bad-latlng" });
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Missing or invalid lat/lng query parameters.",
        example: "/.netlify/functions/firms?lat=29.76&lng=-95.37&days=7",
      }),
    };
  }
  if (!Number.isFinite(days) || days < 1 || days > 5) {
    logEvent({ stage: "validate", ms: Date.now() - t0, note: "bad-days" });
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "`days` must be an integer in [1, 5] (NASA FIRMS area/csv caps DAY_RANGE at 5).",
      }),
    };
  }

  const payload = await runFirms(lat, lng, days, sensor);
  return {
    statusCode: 200,
    headers: jsonHeaders(payload.source),
    body: JSON.stringify(payload),
  };
};

export default handler;
