// ORIN Netlify Function: Google Air Quality proxy.
// POST https://airquality.googleapis.com/v1/currentConditions:lookup?key=...
// Query params: lat, lng
// Returns a trimmed, UI-friendly JSON payload. Falls back to mock data if
// the key is missing, the API rejects the call, or the upstream errors.

type Handler = (event: {
  queryStringParameters?: Record<string, string | undefined>;
  httpMethod?: string;
}) => Promise<{
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}>;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface Pollutant {
  code: string;
  displayName: string;
  fullName?: string;
  concentration?: { value: number; units: string };
  additionalInfo?: { sources?: string; effects?: string };
}

interface Index {
  code: string;
  displayName: string;
  aqi: number;
  aqiDisplay?: string;
  color?: { red?: number; green?: number; blue?: number };
  category?: string;
  dominantPollutant?: string;
}

interface Payload {
  dateTime: string;
  regionCode?: string;
  indexes: Index[];
  pollutants: Pollutant[];
  healthRecommendations?: Record<string, string>;
  source: "live" | "mock";
  fetchedAt: string;
}

const cache = new Map<string, { at: number; payload: Payload }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function jsonHeaders(source: Payload["source"]) {
  return {
    ...CORS_HEADERS,
    "Content-Type": "application/json",
    "Cache-Control":
      source === "live" ? "public, max-age=300" : "public, max-age=60",
  };
}

function logEvent(entry: Record<string, unknown>) {
  try {
    console.log(JSON.stringify({ fn: "airquality", ...entry }));
  } catch {
    /* no-op */
  }
}

function mockPayload(lat: number, lng: number): Payload {
  const seed = Math.abs(Math.sin(lat * lng) * 10_000) % 1;
  const baseAqi = Math.round(28 + seed * 90);
  const universalAqi = Math.round(32 + seed * 60);
  const category =
    baseAqi > 100
      ? "Unhealthy for sensitive groups"
      : baseAqi > 60
        ? "Moderate"
        : "Good";
  const dominant = baseAqi > 80 ? "pm25" : "o3";
  return {
    dateTime: new Date().toISOString(),
    regionCode: "us",
    indexes: [
      {
        code: "uaqi",
        displayName: "Universal AQI",
        aqi: universalAqi,
        aqiDisplay: String(universalAqi),
        category,
        dominantPollutant: dominant,
        color: { red: 0.3, green: 0.7, blue: 0.9 },
      },
      {
        code: "usa_epa",
        displayName: "AQI (US EPA)",
        aqi: baseAqi,
        aqiDisplay: String(baseAqi),
        category,
        dominantPollutant: dominant,
      },
    ],
    pollutants: [
      {
        code: "co",
        displayName: "CO",
        fullName: "Carbon monoxide",
        concentration: { value: 0.2 + seed * 0.4, units: "PARTS_PER_MILLION" },
      },
      {
        code: "no2",
        displayName: "NO2",
        fullName: "Nitrogen dioxide",
        concentration: { value: 8 + seed * 20, units: "PARTS_PER_BILLION" },
      },
      {
        code: "o3",
        displayName: "O3",
        fullName: "Ozone",
        concentration: { value: 20 + seed * 40, units: "PARTS_PER_BILLION" },
      },
      {
        code: "pm25",
        displayName: "PM2.5",
        fullName: "Fine particulate matter",
        concentration: {
          value: 6 + seed * 30,
          units: "MICROGRAMS_PER_CUBIC_METER",
        },
      },
      {
        code: "pm10",
        displayName: "PM10",
        fullName: "Inhalable particulate matter",
        concentration: {
          value: 12 + seed * 40,
          units: "MICROGRAMS_PER_CUBIC_METER",
        },
      },
      {
        code: "so2",
        displayName: "SO2",
        fullName: "Sulfur dioxide",
        concentration: { value: 1 + seed * 4, units: "PARTS_PER_BILLION" },
      },
    ],
    healthRecommendations: {
      generalPopulation:
        baseAqi > 100
          ? "Sensitive groups should limit prolonged outdoor exertion."
          : baseAqi > 60
            ? "Acceptable conditions for most outdoor activity."
            : "Air quality is good; no precautions required.",
    },
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
}

function trimUpstream(raw: any, fetchedAt: string): Payload {
  const indexes: Index[] = Array.isArray(raw?.indexes)
    ? raw.indexes.map((i: any) => ({
        code: String(i.code ?? ""),
        displayName: String(i.displayName ?? i.code ?? ""),
        aqi: Number(i.aqi ?? 0),
        aqiDisplay: i.aqiDisplay ? String(i.aqiDisplay) : undefined,
        color: i.color ?? undefined,
        category: i.category ? String(i.category) : undefined,
        dominantPollutant: i.dominantPollutant
          ? String(i.dominantPollutant)
          : undefined,
      }))
    : [];
  const pollutants: Pollutant[] = Array.isArray(raw?.pollutants)
    ? raw.pollutants.map((p: any) => ({
        code: String(p.code ?? ""),
        displayName: String(p.displayName ?? p.code ?? ""),
        fullName: p.fullName ? String(p.fullName) : undefined,
        concentration: p.concentration
          ? {
              value: Number(p.concentration.value ?? 0),
              units: String(p.concentration.units ?? ""),
            }
          : undefined,
        additionalInfo: p.additionalInfo
          ? {
              sources: p.additionalInfo.sources,
              effects: p.additionalInfo.effects,
            }
          : undefined,
      }))
    : [];

  const healthRecommendations: Record<string, string> | undefined =
    raw?.healthRecommendations && typeof raw.healthRecommendations === "object"
      ? Object.fromEntries(
          Object.entries(raw.healthRecommendations).map(([k, v]) => [
            k,
            String(v),
          ]),
        )
      : undefined;

  return {
    dateTime: String(raw?.dateTime ?? fetchedAt),
    regionCode: raw?.regionCode ? String(raw.regionCode) : undefined,
    indexes,
    pollutants,
    healthRecommendations,
    source: "live",
    fetchedAt,
  };
}

export async function runAirQuality(
  lat: number,
  lng: number,
): Promise<Payload> {
  const key = (lat.toFixed(3) + ":" + lng.toFixed(3));
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.payload;
  }

  const apiKey = process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    logEvent({ stage: "key-missing" });
    const payload = mockPayload(lat, lng);
    cache.set(key, { at: now, payload });
    return payload;
  }

  const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: { latitude: lat, longitude: lng },
        extraComputations: [
          "LOCAL_AQI",
          "POLLUTANT_ADDITIONAL_INFO",
          "DOMINANT_POLLUTANT_CONCENTRATION",
          "HEALTH_RECOMMENDATIONS",
          "POLLUTANT_CONCENTRATION",
        ],
        universalAqi: true,
        languageCode: "en",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      let note = "upstream-non-2xx";
      try {
        const text = await res.text();
        note = text.slice(0, 200);
      } catch {
        /* ignore */
      }
      logEvent({ stage: "upstream-error", status: res.status, note });
      const payload = mockPayload(lat, lng);
      cache.set(key, { at: now, payload });
      return payload;
    }

    const raw = await res.json();
    const payload = trimUpstream(raw, new Date().toISOString());
    cache.set(key, { at: now, payload });
    logEvent({
      stage: "ok",
      indexes: payload.indexes.length,
      pollutants: payload.pollutants.length,
    });
    return payload;
  } catch (err) {
    clearTimeout(timeout);
    logEvent({ stage: "fetch-error", note: String((err as Error).message ?? err).slice(0, 200) });
    const payload = mockPayload(lat, lng);
    cache.set(key, { at: now, payload });
    return payload;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const qs = event.queryStringParameters ?? {};
  const lat = Number(qs.lat);
  const lng = Number(qs.lng);

  if (
    qs.lat == null ||
    qs.lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Missing or invalid lat/lng query parameters.",
        example: "/.netlify/functions/airquality?lat=29.76&lng=-95.37",
      }),
    };
  }

  const payload = await runAirQuality(lat, lng);
  return {
    statusCode: 200,
    headers: jsonHeaders(payload.source),
    body: JSON.stringify(payload),
  };
};
