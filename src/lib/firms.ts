import type { FirmsResponse } from "../types/rin";

const FIRMS_ENDPOINTS = ["/.netlify/functions/firms", "/api/firms"];

export async function fetchFirms(
  lat: number,
  lng: number,
  days = 3,
  signal?: AbortSignal,
): Promise<FirmsResponse> {
  let lastErr: unknown;

  for (const endpoint of FIRMS_ENDPOINTS) {
    try {
      const url = `${endpoint}?lat=${encodeURIComponent(
        String(lat),
      )}&lng=${encodeURIComponent(String(lng))}&days=${encodeURIComponent(
        String(days),
      )}`;
      const res = await fetch(url, { signal });
      if (!res.ok) {
        lastErr = new Error(`FIRMS ${endpoint} → ${res.status}`);
        continue;
      }
      const data = (await res.json()) as FirmsResponse;
      return data;
    } catch (err) {
      lastErr = err;
    }
  }

  // Local-dev fallback when no functions runtime is attached.
  return mockFirms(lat, lng, days);
}

export function mockFirms(
  lat: number,
  lng: number,
  days = 3,
  forceCount?: number,
): FirmsResponse {
  const count =
    forceCount ?? Math.max(0, Math.round((Math.abs(Math.sin(lat * lng)) * 6) - 1));
  const detections = Array.from({ length: count }).map((_, i) => ({
    latitude: lat + (Math.sin(i * 1.3) * 0.18),
    longitude: lng + (Math.cos(i * 1.3) * 0.18),
    bright_ti4: 320 + i * 4,
    bright_ti5: 290 + i * 3,
    acq_date: new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10),
    acq_time: "1830",
    satellite: "VIIRS_SNPP_NRT",
    confidence: i % 2 === 0 ? "n" : "h",
    frp: 5 + i,
    daynight: "N",
  }));
  const status =
    detections.length === 0
      ? "no-anomaly"
      : detections.length <= 3
        ? "low-activity"
        : "review-recommended";
  const statusLabel =
    status === "no-anomaly"
      ? "No thermal anomaly detected"
      : status === "low-activity"
        ? "Low activity signal"
        : "Thermal / flare review recommended";
  return {
    detections,
    count: detections.length,
    scanDays: days,
    bbox: { west: lng - 0.5, south: lat - 0.5, east: lng + 0.5, north: lat + 0.5 },
    status,
    statusLabel,
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
}
