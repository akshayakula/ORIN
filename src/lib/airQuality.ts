import type { AirQualityResponse } from "../types/rin";

const ENDPOINTS = ["/.netlify/functions/airquality", "/api/airquality"];

export async function fetchAirQuality(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<AirQualityResponse> {
  for (const endpoint of ENDPOINTS) {
    try {
      const url = `${endpoint}?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`;
      const res = await fetch(url, { signal });
      if (!res.ok) continue;
      return (await res.json()) as AirQualityResponse;
    } catch {
      /* try next */
    }
  }
  return mockAirQuality(lat, lng);
}

export function mockAirQuality(lat: number, lng: number): AirQualityResponse {
  const seed = Math.abs(Math.sin(lat * lng) * 10_000) % 1;
  const aqi = Math.round(32 + seed * 60);
  const category =
    aqi > 100 ? "Unhealthy for sensitive groups" : aqi > 60 ? "Moderate" : "Good";
  return {
    dateTime: new Date().toISOString(),
    regionCode: "us",
    indexes: [
      { code: "uaqi", displayName: "Universal AQI", aqi, category, dominantPollutant: "pm25" },
    ],
    pollutants: [
      { code: "pm25", displayName: "PM2.5", fullName: "Fine particulate matter", concentration: { value: 6 + seed * 30, units: "MICROGRAMS_PER_CUBIC_METER" } },
      { code: "no2", displayName: "NO2", fullName: "Nitrogen dioxide", concentration: { value: 8 + seed * 20, units: "PARTS_PER_BILLION" } },
      { code: "o3", displayName: "O3", fullName: "Ozone", concentration: { value: 20 + seed * 40, units: "PARTS_PER_BILLION" } },
    ],
    healthRecommendations: { generalPopulation: "Mocked reading — connect GOOGLE_API_KEY for live data." },
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
}

export function aqiStatus(aqi: number): {
  tone: "good" | "moderate" | "unhealthy" | "hazardous";
  label: string;
  toneClass: string;
} {
  if (aqi <= 50)
    return {
      tone: "good",
      label: "Good",
      toneClass: "bg-cyan-glow/15 text-cyan-200 border-cyan-400/30",
    };
  if (aqi <= 100)
    return {
      tone: "moderate",
      label: "Moderate",
      toneClass: "bg-amber-glow/15 text-amber-200 border-amber-400/30",
    };
  if (aqi <= 150)
    return {
      tone: "unhealthy",
      label: "Unhealthy for sensitive groups",
      toneClass: "bg-rose-glow/15 text-rose-200 border-rose-400/30",
    };
  return {
    tone: "hazardous",
    label: "Hazardous",
    toneClass: "bg-rose-500/25 text-rose-100 border-rose-500/40 shadow-glowRose",
  };
}
