#!/usr/bin/env node
// Seeds the ORIN marketplace directly into Upstash Redis.
// Usage: node scripts/seed-upstash.mjs
// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from .env.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!URL || !TOKEN) {
  console.error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN in .env");
  process.exit(1);
}

async function pipeline(cmds) {
  const res = await fetch(`${URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmds),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upstash pipeline ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function redis(cmd) {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  return res.json();
}

const D_TYPES = {
  D3: "Cellulosic / RNG",
  D4: "Biomass-based Diesel",
  D5: "Advanced Biofuel",
  D6: "Renewable Fuel / Ethanol",
  D7: "Cellulosic Diesel",
};

const QAP = ["EcoEngineers", "Christianson PLLP", "Weaver and Tidwell", "RSB", "ISCC+"];

const ORIGINAL_22 = [
  { id: "ORIN-D3-001", lat: 44.9778, lng: -93.265, city: "Minneapolis, MN", dCode: "D3", quantity: 250000, vintage: 2025, price: 0.92, seller: "Green Valley RNG LLC", facility: "Green Valley Landfill RNG", qapProvider: "EcoEngineers", qapStatus: "Verified", orinGrade: "A", riskScore: 18, satelliteStatus: "No major mismatch", recommendation: "Suitable for purchase after standard review" },
  { id: "ORIN-D4-002", lat: 41.8781, lng: -87.6298, city: "Chicago, IL", dCode: "D4", quantity: 500000, vintage: 2025, price: 0.84, seller: "Midwest Biofuels Trading", facility: "Prairie Renewable Diesel", qapProvider: "Christianson PLLP", qapStatus: "Verified", orinGrade: "B", riskScore: 46, satelliteStatus: "No satellite mismatch; document review needed", recommendation: "Purchase only after targeted document review" },
  { id: "ORIN-D3-003", lat: 39.7392, lng: -104.9903, city: "Denver, CO", dCode: "D3", quantity: 400000, vintage: 2025, price: 0.71, seller: "Summit Environmental Credits", facility: "Summit Landfill Gas Project", qapProvider: "Not verified", qapStatus: "Missing", orinGrade: "C", riskScore: 82, satelliteStatus: "Methane mismatch detected", recommendation: "Do not purchase without enhanced diligence" },
  { id: "ORIN-D5-004", lat: 29.7604, lng: -95.3698, city: "Houston, TX", dCode: "D5", quantity: 150000, vintage: 2024, price: 0.63, seller: "Atlantic Credit Desk", facility: "Coastal Bioenergy Import Terminal", qapProvider: "Partial docs", qapStatus: "Partial", orinGrade: "C", riskScore: 76, satelliteStatus: "Supply-chain review needed", recommendation: "Enhanced review required" },
  { id: "ORIN-D4-005", lat: 37.7749, lng: -122.4194, city: "San Francisco, CA", dCode: "D4", quantity: 750000, vintage: 2025, price: 0.98, seller: "NorthStar Renewable Fuels", facility: "NorthStar RD Facility", qapProvider: "Weaver and Tidwell", qapStatus: "Verified", orinGrade: "A+", riskScore: 9, satelliteStatus: "No major mismatch", recommendation: "Premium verified lot" },
  { id: "ORIN-D6-006", lat: 41.2565, lng: -95.9345, city: "Omaha, NE", dCode: "D6", quantity: 300000, vintage: 2025, price: 0.39, seller: "Heartland Ethanol Exchange", facility: "Heartland Ethanol Plant", qapProvider: "Missing", qapStatus: "Missing", orinGrade: "B-", riskScore: 58, satelliteStatus: "No satellite mismatch; missing docs", recommendation: "Needs additional documentation" },
];

// 30 NEW listings — diverse companies, geographies, D-codes
const ADDITIONAL = [
  ["ORIN-D3-100", "POET Bioprocessing — Chancellor", "POET", 43.5460, -97.2206, "Chancellor, SD", "D3", 880000, 2026, 0.94, "EcoEngineers", "Verified", "A", 21],
  ["ORIN-D4-101", "Diamond Green Diesel — Norco", "Diamond Green Diesel", 30.0027, -90.4151, "Norco, LA", "D4", 1200000, 2026, 1.02, "Weaver and Tidwell", "Verified", "A+", 11],
  ["ORIN-D6-102", "Green Plains Madison", "Green Plains", 41.7370, -97.4594, "Madison, NE", "D6", 620000, 2026, 0.41, "EcoEngineers", "Verified", "A", 19],
  ["ORIN-D3-103", "Montauk RNG — Rumpke", "Montauk Renewables", 39.1750, -84.5250, "Cincinnati, OH", "D3", 240000, 2026, 0.92, "EcoEngineers", "Verified", "A", 22],
  ["ORIN-D3-104", "CEF Dairy RNG — Tulare", "Clean Energy Fuels", 36.2077, -119.3473, "Tulare, CA", "D3", 180000, 2026, 0.95, "EcoEngineers", "Verified", "A", 17],
  ["ORIN-D5-105", "Aemetis Keyes", "Aemetis", 37.5610, -120.9151, "Keyes, CA", "D5", 320000, 2026, 0.78, "Weaver and Tidwell", "Verified", "A", 24],
  ["ORIN-D4-106", "REG Geismar", "REG", 30.2293, -91.0099, "Geismar, LA", "D4", 950000, 2026, 0.99, "Weaver and Tidwell", "Verified", "A", 14],
  ["ORIN-D6-107", "ADM Cedar Rapids", "Archer Daniels Midland", 41.9779, -91.6656, "Cedar Rapids, IA", "D6", 1500000, 2026, 0.40, "EcoEngineers", "Verified", "A", 16],
  ["ORIN-D3-108", "WM Outer Loop RNG", "Waste Management RNG", 38.0472, -85.7585, "Louisville, KY", "D3", 320000, 2026, 0.89, "EcoEngineers", "Verified", "A", 25],
  ["ORIN-D4-109", "Marathon Dickinson RD", "Marathon Petroleum", 46.8772, -102.7896, "Dickinson, ND", "D4", 1100000, 2026, 1.04, "Christianson PLLP", "Verified", "A+", 12],
  ["ORIN-D6-110", "Valero Renewable Fuels — Albert City", "Valero", 42.7858, -94.9569, "Albert City, IA", "D6", 720000, 2026, 0.43, "EcoEngineers", "Verified", "A", 23],
  ["ORIN-D3-111", "BP Bioenergy Lockbourne", "BP Bioenergy", 39.8285, -82.9777, "Lockbourne, OH", "D3", 270000, 2026, 0.87, "Christianson PLLP", "Partial", "B+", 38],
  ["ORIN-D5-112", "Gevo Luverne", "Gevo", 43.6541, -96.2128, "Luverne, MN", "D5", 280000, 2026, 0.81, "Weaver and Tidwell", "Verified", "A", 26],
  ["ORIN-D4-113", "Phillips 66 Rodeo Renewed", "Phillips 66", 38.0319, -122.2643, "Rodeo, CA", "D4", 1450000, 2026, 1.06, "Weaver and Tidwell", "Verified", "A+", 10],
  ["ORIN-D6-114", "Pacific Ethanol Stockton", "Alto Ingredients", 37.9577, -121.2908, "Stockton, CA", "D6", 480000, 2026, 0.45, "EcoEngineers", "Verified", "A", 28],
  ["ORIN-D3-115", "Rumpke RNG Beech Hollow", "Rumpke", 40.0094, -82.9988, "Columbus, OH", "D3", 195000, 2026, 0.91, "EcoEngineers", "Pending", "B", 44],
  ["ORIN-D4-116", "HF Sinclair Cheyenne", "HF Sinclair", 41.1400, -104.8202, "Cheyenne, WY", "D4", 880000, 2026, 0.96, "Weaver and Tidwell", "Verified", "A", 20],
  ["ORIN-D3-117", "Republic Services Glenwillow", "Republic Services", 41.3853, -81.4715, "Glenwillow, OH", "D3", 220000, 2025, 0.84, "EcoEngineers", "Partial", "B", 41],
  ["ORIN-D6-118", "Glacial Lakes Energy Watertown", "Glacial Lakes Energy", 44.8997, -97.1142, "Watertown, SD", "D6", 540000, 2026, 0.42, "EcoEngineers", "Verified", "A", 22],
  ["ORIN-D4-119", "Chevron El Segundo RD", "Chevron Renewable Energy", 33.9173, -118.4060, "El Segundo, CA", "D4", 1300000, 2026, 1.08, "Weaver and Tidwell", "Verified", "A+", 13],
  ["ORIN-D5-120", "Clean Energy Edmonton Renewable Hub", "Clean Energy Fuels", 35.4934, -97.4667, "Edmond, OK", "D5", 165000, 2026, 0.76, "EcoEngineers", "Verified", "A", 27],
  ["ORIN-D3-121", "DTE Vector Pipeline RNG", "DTE Energy", 42.3314, -83.0458, "Detroit, MI", "D3", 360000, 2026, 0.93, "Christianson PLLP", "Verified", "A", 21],
  ["ORIN-D6-122", "Cardinal Ethanol Union City", "Cardinal Ethanol", 40.1953, -84.8225, "Union City, IN", "D6", 590000, 2026, 0.40, "EcoEngineers", "Verified", "A", 24],
  ["ORIN-D4-123", "PBF Energy Chalmette RD", "PBF Energy", 29.9404, -89.9578, "Chalmette, LA", "D4", 980000, 2026, 0.97, "Weaver and Tidwell", "Verified", "A", 18],
  ["ORIN-D3-124", "Casella Waste RNG", "Casella Waste Systems", 43.6106, -72.9726, "Rutland, VT", "D3", 140000, 2026, 0.95, "EcoEngineers", "Pending", "B+", 36],
  ["ORIN-D5-125", "Renewable Energy Group Mason City", "REG", 43.1536, -93.2010, "Mason City, IA", "D5", 410000, 2026, 0.79, "Christianson PLLP", "Verified", "A", 23],
  ["ORIN-D6-126", "Husker Ag Plainview", "Husker Ag LLC", 42.3469, -97.7906, "Plainview, NE", "D6", 380000, 2026, 0.41, "EcoEngineers", "Verified", "A", 20],
  ["ORIN-D3-127", "Onyx RNG Frisco", "Onyx Renewable Partners", 33.1507, -96.8236, "Frisco, TX", "D3", 230000, 2026, 0.88, "EcoEngineers", "Partial", "B", 47],
  ["ORIN-D4-128", "Chevron Pasadena Texas RD", "Chevron Renewable Energy", 29.6914, -95.2091, "Pasadena, TX", "D4", 1180000, 2026, 1.05, "Weaver and Tidwell", "Verified", "A+", 11],
  ["ORIN-D6-129", "Andersons Marathon Albion", "The Andersons", 42.2436, -84.7536, "Albion, MI", "D6", 460000, 2026, 0.42, "Christianson PLLP", "Verified", "A", 25],
];

const now = Date.now();
const listings = [];

ORIGINAL_22.forEach((l, i) => {
  listings.push({
    ...l,
    type: D_TYPES[l.dCode],
    createdAt: new Date(now - (i + ADDITIONAL.length) * 86400_000).toISOString(),
    source: "demo",
  });
});

ADDITIONAL.forEach((row, i) => {
  const [id, facility, seller, lat, lng, city, dCode, quantity, vintage, price, qapProvider, qapStatus, orinGrade, riskScore] = row;
  listings.push({
    id,
    lat,
    lng,
    city,
    dCode,
    type: D_TYPES[dCode],
    quantity,
    vintage,
    price,
    seller,
    facility,
    qapProvider,
    qapStatus,
    orinGrade,
    riskScore,
    satelliteStatus:
      riskScore <= 25
        ? "No major mismatch"
        : riskScore <= 50
          ? "Standard review"
          : "Document review needed",
    recommendation:
      riskScore <= 25
        ? "Suitable for purchase after standard review"
        : riskScore <= 50
          ? "Standard review recommended"
          : "Targeted documentation review",
    createdAt: new Date(now - i * 3600_000).toISOString(),
    source: "demo",
  });
});

console.log(`Pushing ${listings.length} listings to Upstash…`);

// Build pipeline: SET each listing + SADD set + return count
const cmds = [];
for (const l of listings) {
  cmds.push(["SET", `orin:listing:${l.id}`, JSON.stringify(l)]);
  cmds.push(["SADD", "orin:listings:set", l.id]);
}

const result = await pipeline(cmds);
const errors = result.filter((r) => r.error);
if (errors.length) {
  console.error("Errors during pipeline:", errors.slice(0, 3));
  process.exit(1);
}

const card = await redis(["SCARD", "orin:listings:set"]);
console.log(`✓ Done. orin:listings:set now has ${card.result} members.`);
