// Netlify Function: server-side audit runner.
// Enriches a lot audit with live NASA FIRMS data by reusing runFirms().

import { runFirms, type FirmsResponse, type FirmsSensor } from "./firms.ts";

type Handler = (event: {
  httpMethod?: string;
  body?: string | null;
}) => Promise<{
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}>;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

interface AuditRequest {
  lat?: unknown;
  lng?: unknown;
  lotId?: unknown;
  days?: unknown;
  sensor?: unknown;
}

interface AuditResponse {
  lotId: string;
  firms: FirmsResponse;
  generatedAt: string;
  scanWindowDays: number;
  summary: string;
}

const ALLOWED_SENSORS: FirmsSensor[] = [
  "VIIRS_SNPP_NRT",
  "VIIRS_NOAA20_NRT",
  "MODIS_NRT",
];

function summarize(firms: FirmsResponse, lotId: string): string {
  const sensor = firms.source_sensor;
  const window = firms.scanDays;
  const base = `Lot ${lotId}: scanned ${window}-day window via ${sensor} (${firms.source}). ${firms.statusLabel}.`;
  if (firms.status === "review-recommended") {
    return `${base} ${firms.count} thermal detection(s) — ORIN recommends deeper audit.`;
  }
  if (firms.status === "low-activity") {
    return `${base} ${firms.count} low-intensity detection(s) — within expected bounds.`;
  }
  return `${base} No anomalies detected in bbox.`;
}

export const handler: Handler = async (event) => {
  const method = event.httpMethod ?? "POST";
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (method !== "POST") {
    return {
      statusCode: 405,
      headers: { ...JSON_HEADERS, Allow: "POST, OPTIONS" },
      body: JSON.stringify({ error: `Method ${method} not allowed.` }),
    };
  }

  let parsed: AuditRequest = {};
  try {
    parsed = event.body ? (JSON.parse(event.body) as AuditRequest) : {};
  } catch {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "Invalid JSON body." }),
    };
  }

  const lat = Number(parsed.lat);
  const lng = Number(parsed.lng);
  const lotId = typeof parsed.lotId === "string" ? parsed.lotId.trim() : "";
  const rawDays = parsed.days == null ? 7 : Number(parsed.days);
  const days = Math.floor(rawDays);
  const sensorRaw =
    typeof parsed.sensor === "string" ? parsed.sensor.toUpperCase() : "";
  const sensor: FirmsSensor =
    (ALLOWED_SENSORS.find((s) => s === sensorRaw) as FirmsSensor | undefined) ??
    "VIIRS_SNPP_NRT";

  const errors: Array<{ field: string; message: string }> = [];
  if (!lotId) errors.push({ field: "lotId", message: "lotId is required." });
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    errors.push({ field: "lat", message: "lat must be in [-90, 90]." });
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    errors.push({ field: "lng", message: "lng must be in [-180, 180]." });
  }
  if (!Number.isFinite(days) || days < 1 || days > 10) {
    errors.push({ field: "days", message: "days must be an integer in [1, 10]." });
  }
  if (errors.length > 0) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ errors }),
    };
  }

  const firms = await runFirms(lat, lng, days, sensor);
  const response: AuditResponse = {
    lotId,
    firms,
    generatedAt: new Date().toISOString(),
    scanWindowDays: days,
    summary: summarize(firms, lotId),
  };

  return {
    statusCode: 200,
    headers: JSON_HEADERS,
    body: JSON.stringify(response),
  };
};

export default handler;
