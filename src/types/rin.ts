export type DCode = "D3" | "D4" | "D5" | "D6" | "D7";

export type ORINGrade = "A+" | "A" | "B+" | "B" | "B-" | "C+" | "C" | "D";

export type QAPStatus = "Verified" | "Partial" | "Missing" | "Pending";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export interface RinLot {
  id: string;
  lat: number;
  lng: number;
  city: string;
  dCode: DCode;
  type: string;
  quantity: number;
  vintage: number;
  price: number;
  seller: string;
  facility: string;
  qapProvider: string;
  qapStatus: QAPStatus;
  orinGrade: ORINGrade;
  riskScore: number;
  satelliteStatus: string;
  recommendation: string;
}

export interface RiskFlag {
  severity: RiskSeverity;
  title: string;
  description: string;
  recommendedAction: string;
}

export interface FirmsDetection {
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

export interface FirmsResponse {
  detections: FirmsDetection[];
  count: number;
  scanDays: number;
  bbox: { west: number; south: number; east: number; north: number };
  status: "no-anomaly" | "low-activity" | "review-recommended";
  statusLabel: string;
  source: "live" | "mock";
  source_sensor?: string;
  fetchedAt: string;
}

export interface AnalyticsSnapshot {
  marketPercentile: number;
  riskAdjustedValue: number;
  documentCompleteness: number;
  satelliteMismatch: boolean;
  replacementRiskExposure: number;
  recommendation: string;
}

export type AppStage =
  | "globe"
  | "panel"
  | "audit-loading"
  | "audit-results"
  | "purchase-confirmed";

export interface AirQualityPollutant {
  code: string;
  displayName: string;
  fullName?: string;
  concentration?: { value: number; units: string };
  additionalInfo?: { sources?: string; effects?: string };
}

export interface AirQualityIndex {
  code: string;
  displayName: string;
  aqi: number;
  aqiDisplay?: string;
  color?: { red?: number; green?: number; blue?: number };
  category?: string;
  dominantPollutant?: string;
}

export interface AirQualityResponse {
  dateTime: string;
  regionCode?: string;
  indexes: AirQualityIndex[];
  pollutants: AirQualityPollutant[];
  healthRecommendations?: Record<string, string>;
  source: "live" | "mock";
  fetchedAt: string;
}
