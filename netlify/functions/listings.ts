// Netlify Function: seller listings.
// GET  → returns baseline sample listings + any in-memory POSTed ones (warm container only).
// POST → validates payload, computes preliminary ORIN risk, appends, returns the new listing.

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
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type DCode = "D3" | "D4" | "D5" | "D6" | "D7";
type QAPStatus = "Verified" | "Partial" | "Missing" | "Pending";
type ORINGrade = "A+" | "A" | "B+" | "B" | "B-" | "C+" | "C" | "D";

interface Listing {
  id: string;
  name: string;
  email: string;
  company: string;
  facility: string;
  dCode: DCode;
  type: string;
  quantity: number;
  vintage: number;
  price: number;
  lat: number;
  lng: number;
  city: string;
  qapProvider?: string;
  qapStatus: QAPStatus;
  riskScore: number;
  orinGrade: ORINGrade;
  satelliteStatus: string;
  recommendation: string;
  source: "seller" | "seed";
  createdAt: string;
}

// ---- Seed listings (always returned) -----------------------------------------

const SEED: Listing[] = [
  {
    id: "ORIN-D4-SELLER-SEED001",
    name: "Dana Reyes",
    email: "dana@prairiebio.example",
    company: "Prairie Bio Fuels",
    facility: "Prairie Bio Fuels — Ames Plant",
    dCode: "D4",
    type: "Biomass-based Diesel",
    quantity: 250_000,
    vintage: 2025,
    price: 1.32,
    lat: 42.034,
    lng: -93.62,
    city: "Ames, IA",
    qapProvider: "Genscape Q-LCA",
    qapStatus: "Verified",
    riskScore: 22,
    orinGrade: "A",
    satelliteStatus: "Pending ORIN satellite review",
    recommendation: "Pending ORIN Integrity Audit",
    source: "seed",
    createdAt: "2026-04-20T14:22:00.000Z",
  },
  {
    id: "ORIN-D6-SELLER-SEED002",
    name: "Marcus Ibarra",
    email: "marcus@gulfcoastrenew.example",
    company: "Gulf Coast Renewables",
    facility: "Gulf Coast Renewables — Port Arthur",
    dCode: "D6",
    type: "Renewable Fuel (Ethanol)",
    quantity: 1_800_000,
    vintage: 2024,
    price: 0.41,
    lat: 29.87,
    lng: -93.93,
    city: "Port Arthur, TX",
    qapProvider: "EcoEngineers",
    qapStatus: "Partial",
    riskScore: 73,
    orinGrade: "C+",
    satelliteStatus: "Pending ORIN satellite review",
    recommendation: "Pending ORIN Integrity Audit",
    source: "seed",
    createdAt: "2026-04-22T09:10:00.000Z",
  },
];

// Warm-container augmentation — resets on cold start.
const userListings: Listing[] = [];

// ---- Validation helpers -------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_DCODES: DCode[] = ["D3", "D4", "D5", "D6", "D7"];

interface ValidationError {
  field: string;
  message: string;
}

function validate(body: unknown): {
  ok: boolean;
  errors: ValidationError[];
  value: {
    name: string;
    email: string;
    company: string;
    facility: string;
    dCode: DCode;
    type: string;
    quantity: number;
    vintage: number;
    price: number;
    lat: number;
    lng: number;
    city: string;
    qapProvider?: string;
    qapStatus?: QAPStatus;
  } | null;
} {
  const errors: ValidationError[] = [];
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      errors: [{ field: "body", message: "Request body must be a JSON object." }],
      value: null,
    };
  }
  const b = body as Record<string, unknown>;
  const str = (k: string, label = k) => {
    const v = b[k];
    if (typeof v !== "string" || v.trim().length === 0) {
      errors.push({ field: k, message: `${label} is required.` });
      return "";
    }
    return v.trim();
  };
  const num = (k: string, label = k) => {
    const v = b[k];
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) {
      errors.push({ field: k, message: `${label} must be a number.` });
      return NaN;
    }
    return n;
  };

  const name = str("name");
  const emailRaw = str("email");
  if (emailRaw && !EMAIL_RE.test(emailRaw)) {
    errors.push({ field: "email", message: "email must be a valid address." });
  }
  const company = str("company");
  const facility = str("facility");
  const dCodeRaw = typeof b.dCode === "string" ? b.dCode.toUpperCase() : "";
  if (!ALLOWED_DCODES.includes(dCodeRaw as DCode)) {
    errors.push({
      field: "dCode",
      message: `dCode must be one of ${ALLOWED_DCODES.join(", ")}.`,
    });
  }
  const type = str("type");
  const quantity = num("quantity");
  if (Number.isFinite(quantity) && quantity <= 0) {
    errors.push({ field: "quantity", message: "quantity must be > 0." });
  }
  const vintage = num("vintage");
  if (Number.isFinite(vintage) && (vintage < 2020 || vintage > 2030)) {
    errors.push({ field: "vintage", message: "vintage must be 2020..2030." });
  }
  const price = num("price");
  if (Number.isFinite(price) && price <= 0) {
    errors.push({ field: "price", message: "price must be > 0." });
  }
  const lat = num("lat");
  if (Number.isFinite(lat) && (lat < -90 || lat > 90)) {
    errors.push({ field: "lat", message: "lat must be in [-90, 90]." });
  }
  const lng = num("lng");
  if (Number.isFinite(lng) && (lng < -180 || lng > 180)) {
    errors.push({ field: "lng", message: "lng must be in [-180, 180]." });
  }
  const city = str("city");

  const qapProvider =
    typeof b.qapProvider === "string" ? b.qapProvider.trim() : undefined;
  const qapStatusRaw =
    typeof b.qapStatus === "string" ? b.qapStatus : undefined;
  const qapStatus: QAPStatus | undefined =
    qapStatusRaw === "Verified" ||
    qapStatusRaw === "Partial" ||
    qapStatusRaw === "Missing" ||
    qapStatusRaw === "Pending"
      ? qapStatusRaw
      : undefined;

  if (errors.length > 0) {
    return { ok: false, errors, value: null };
  }
  return {
    ok: true,
    errors: [],
    value: {
      name,
      email: emailRaw,
      company,
      facility,
      dCode: dCodeRaw as DCode,
      type,
      quantity,
      vintage,
      price,
      lat,
      lng,
      city,
      qapProvider,
      qapStatus,
    },
  };
}

// ---- Scoring -----------------------------------------------------------------

function computeRisk(
  qapStatus: QAPStatus,
  price: number,
  quantity: number,
): number {
  const base =
    qapStatus === "Verified"
      ? 22
      : qapStatus === "Partial"
        ? 55
        : qapStatus === "Missing"
          ? 72
          : 45; // Pending
  let score = base;
  if (price < 0.5) score += 10;
  if (quantity > 1_000_000) score += 8;
  return Math.max(0, Math.min(100, score));
}

function grade(risk: number): ORINGrade {
  if (risk < 20) return "A+";
  if (risk < 30) return "A";
  if (risk < 40) return "B+";
  if (risk < 50) return "B";
  if (risk < 60) return "B-";
  if (risk < 70) return "C+";
  if (risk < 80) return "C";
  return "D";
}

function rand6(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ---- Handler -----------------------------------------------------------------

const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export const handler: Handler = async (event) => {
  const method = event.httpMethod ?? "GET";
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (method === "GET") {
    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        count: SEED.length + userListings.length,
        listings: [...SEED, ...userListings],
      }),
    };
  }

  if (method === "POST") {
    let parsed: unknown = {};
    try {
      parsed = event.body ? JSON.parse(event.body) : {};
    } catch {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({
          errors: [{ field: "body", message: "Invalid JSON body." }],
        }),
      };
    }
    const v = validate(parsed);
    if (!v.ok || !v.value) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ errors: v.errors }),
      };
    }
    const val = v.value;
    const qapStatus: QAPStatus = val.qapStatus ?? "Pending";
    const riskScore = computeRisk(qapStatus, val.price, val.quantity);
    const listing: Listing = {
      id: `ORIN-${val.dCode}-SELLER-${rand6()}`,
      name: val.name,
      email: val.email,
      company: val.company,
      facility: val.facility,
      dCode: val.dCode,
      type: val.type,
      quantity: val.quantity,
      vintage: val.vintage,
      price: val.price,
      lat: val.lat,
      lng: val.lng,
      city: val.city,
      qapProvider: val.qapProvider,
      qapStatus,
      riskScore,
      orinGrade: grade(riskScore),
      satelliteStatus: "Pending ORIN satellite review",
      recommendation: "Pending ORIN Integrity Audit",
      source: "seller",
      createdAt: new Date().toISOString(),
    };
    userListings.push(listing);
    return {
      statusCode: 201,
      headers: JSON_HEADERS,
      body: JSON.stringify({ listing }),
    };
  }

  return {
    statusCode: 405,
    headers: { ...JSON_HEADERS, Allow: "GET, POST, OPTIONS" },
    body: JSON.stringify({ error: `Method ${method} not allowed.` }),
  };
};

export default handler;
