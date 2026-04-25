// ORIN — seller listings backed by Upstash Redis (REST).
// Single function dispatches GET/POST/DELETE on /listings and /listings/:id

import { redis, pipeline, isConfigured } from "./_upstash";

type Handler = (event: {
  path?: string;
  rawUrl?: string;
  httpMethod?: string;
  body?: string | null;
  queryStringParameters?: Record<string, string | undefined>;
}) => Promise<{
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}>;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const JSON_HEADERS: Record<string, string> = {
  ...CORS_HEADERS,
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const KEY_SET = "orin:listings:set";
const listingKey = (id: string) => `orin:listing:${id}`;

// Curated demo catalog seeded into Upstash on demand. Marketplace UI no
// longer ships any hardcoded lots — these examples bootstrap a fresh env.
const DEMO_CATALOG: Array<Omit<SellerListing, "createdAt" | "source">> = [
  { id: "ORIN-D3-001", lat: 44.9778, lng: -93.265, city: "Minneapolis, MN", dCode: "D3", type: "Cellulosic / RNG", quantity: 250000, vintage: 2025, price: 0.92, seller: "Green Valley RNG LLC", facility: "Green Valley Landfill RNG", qapProvider: "EcoEngineers", qapStatus: "Verified", orinGrade: "A", riskScore: 18, satelliteStatus: "No major mismatch", recommendation: "Suitable for purchase after standard review" },
  { id: "ORIN-D4-002", lat: 41.8781, lng: -87.6298, city: "Chicago, IL", dCode: "D4", type: "Biomass-based Diesel", quantity: 500000, vintage: 2025, price: 0.84, seller: "Midwest Biofuels Trading", facility: "Prairie Renewable Diesel", qapProvider: "Christianson PLLP", qapStatus: "Verified", orinGrade: "B", riskScore: 46, satelliteStatus: "No satellite mismatch; document review needed", recommendation: "Purchase only after targeted document review" },
  { id: "ORIN-D3-003", lat: 39.7392, lng: -104.9903, city: "Denver, CO", dCode: "D3", type: "Cellulosic / RNG", quantity: 400000, vintage: 2025, price: 0.71, seller: "Summit Environmental Credits", facility: "Summit Landfill Gas Project", qapProvider: "Not verified", qapStatus: "Missing", orinGrade: "C", riskScore: 82, satelliteStatus: "Methane mismatch detected", recommendation: "Do not purchase without enhanced diligence" },
  { id: "ORIN-D5-004", lat: 29.7604, lng: -95.3698, city: "Houston, TX", dCode: "D5", type: "Advanced Biofuel", quantity: 150000, vintage: 2024, price: 0.63, seller: "Atlantic Credit Desk", facility: "Coastal Bioenergy Import Terminal", qapProvider: "Partial docs", qapStatus: "Partial", orinGrade: "C", riskScore: 76, satelliteStatus: "Supply-chain review needed", recommendation: "Enhanced review required" },
  { id: "ORIN-D4-005", lat: 37.7749, lng: -122.4194, city: "San Francisco, CA", dCode: "D4", type: "Renewable Diesel", quantity: 750000, vintage: 2025, price: 0.98, seller: "NorthStar Renewable Fuels", facility: "NorthStar RD Facility", qapProvider: "Weaver and Tidwell", qapStatus: "Verified", orinGrade: "A+", riskScore: 9, satelliteStatus: "No major mismatch", recommendation: "Premium verified lot" },
  { id: "ORIN-D6-006", lat: 41.2565, lng: -95.9345, city: "Omaha, NE", dCode: "D6", type: "Renewable Fuel / Ethanol", quantity: 300000, vintage: 2025, price: 0.39, seller: "Heartland Ethanol Exchange", facility: "Heartland Ethanol Plant", qapProvider: "Missing", qapStatus: "Missing", orinGrade: "B-", riskScore: 58, satelliteStatus: "No satellite mismatch; missing docs", recommendation: "Needs additional documentation" },
  { id: "ORIN-D3-007", lat: 33.4484, lng: -112.074, city: "Phoenix, AZ", dCode: "D3", type: "Cellulosic / RNG", quantity: 180000, vintage: 2026, price: 0.88, seller: "Sonoran Renewables", facility: "Sonoran Dairy Digester", qapProvider: "EcoEngineers", qapStatus: "Verified", orinGrade: "A", riskScore: 22, satelliteStatus: "No major mismatch", recommendation: "Suitable for purchase after standard review" },
  { id: "ORIN-D4-008", lat: 47.6062, lng: -122.3321, city: "Seattle, WA", dCode: "D4", type: "Biomass-based Diesel", quantity: 420000, vintage: 2026, price: 0.96, seller: "Cascade Renewable Trading", facility: "Cascade Biodiesel Co-op", qapProvider: "Christianson PLLP", qapStatus: "Verified", orinGrade: "A", riskScore: 17, satelliteStatus: "No major mismatch", recommendation: "Premium verified lot" },
  { id: "ORIN-D6-009", lat: 40.4406, lng: -79.9959, city: "Pittsburgh, PA", dCode: "D6", type: "Renewable Fuel / Ethanol", quantity: 275000, vintage: 2024, price: 0.42, seller: "Allegheny Fuel Desk", facility: "Allegheny Grain Ethanol", qapProvider: "EcoEngineers", qapStatus: "Verified", orinGrade: "B+", riskScore: 32, satelliteStatus: "No major mismatch", recommendation: "Suitable for purchase after standard review" },
  { id: "ORIN-D5-010", lat: 32.7767, lng: -96.797, city: "Dallas, TX", dCode: "D5", type: "Advanced Biofuel", quantity: 320000, vintage: 2025, price: 0.74, seller: "Lone Star Advanced Fuels", facility: "Lone Star Biogas Facility", qapProvider: "Weaver and Tidwell", qapStatus: "Verified", orinGrade: "B", riskScore: 41, satelliteStatus: "No major mismatch", recommendation: "Suitable for purchase after standard review" },
  { id: "ORIN-D3-011", lat: 35.2271, lng: -80.8431, city: "Charlotte, NC", dCode: "D3", type: "Cellulosic / RNG", quantity: 210000, vintage: 2026, price: 0.79, seller: "Piedmont Gas Exchange", facility: "Piedmont Dairy Digester", qapProvider: "Partial docs", qapStatus: "Partial", orinGrade: "B", riskScore: 48, satelliteStatus: "Document review needed", recommendation: "Purchase only after targeted document review" },
  { id: "ORIN-D4-012", lat: 30.2672, lng: -97.7431, city: "Austin, TX", dCode: "D4", type: "Renewable Diesel", quantity: 860000, vintage: 2025, price: 1.02, seller: "Hill Country Renewable", facility: "Hill Country RD Terminal", qapProvider: "Weaver and Tidwell", qapStatus: "Verified", orinGrade: "A+", riskScore: 11, satelliteStatus: "No major mismatch", recommendation: "Premium verified lot" },
  { id: "ORIN-D6-013", lat: 39.7684, lng: -86.1581, city: "Indianapolis, IN", dCode: "D6", type: "Renewable Fuel / Ethanol", quantity: 500000, vintage: 2025, price: 0.36, seller: "Crossroads Ethanol Coop", facility: "Crossroads Corn Ethanol", qapProvider: "EcoEngineers", qapStatus: "Verified", orinGrade: "A", riskScore: 19, satelliteStatus: "No major mismatch", recommendation: "Suitable for purchase after standard review" },
  { id: "ORIN-D3-014", lat: 34.0522, lng: -118.2437, city: "Los Angeles, CA", dCode: "D3", type: "Cellulosic / RNG", quantity: 340000, vintage: 2025, price: 0.68, seller: "Pacific Methane Partners", facility: "Puente Hills Landfill RNG", qapProvider: "Pending", qapStatus: "Pending", orinGrade: "C+", riskScore: 63, satelliteStatus: "Satellite review pending", recommendation: "Enhanced review required" },
  { id: "ORIN-D5-015", lat: 42.3601, lng: -71.0589, city: "Boston, MA", dCode: "D5", type: "Advanced Biofuel", quantity: 190000, vintage: 2026, price: 0.82, seller: "Boston Harbor Credits", facility: "Harbor Advanced Biofuel", qapProvider: "EcoEngineers", qapStatus: "Verified", orinGrade: "A", riskScore: 21, satelliteStatus: "No major mismatch", recommendation: "Suitable for purchase after standard review" },
  { id: "ORIN-D4-016", lat: 25.7617, lng: -80.1918, city: "Miami, FL", dCode: "D4", type: "Biomass-based Diesel", quantity: 260000, vintage: 2025, price: 0.89, seller: "Everglades Biofuels", facility: "Everglades RD Plant", qapProvider: "Christianson PLLP", qapStatus: "Verified", orinGrade: "A", riskScore: 24, satelliteStatus: "No major mismatch", recommendation: "Suitable for purchase after standard review" },
  { id: "ORIN-D6-017", lat: 38.627, lng: -90.1994, city: "St. Louis, MO", dCode: "D6", type: "Renewable Fuel / Ethanol", quantity: 610000, vintage: 2025, price: 0.41, seller: "Gateway Ethanol Desk", facility: "Gateway Grain Ethanol", qapProvider: "Partial docs", qapStatus: "Partial", orinGrade: "B", riskScore: 44, satelliteStatus: "Document review needed", recommendation: "Purchase only after targeted document review" },
  { id: "ORIN-D3-018", lat: 45.5152, lng: -122.6784, city: "Portland, OR", dCode: "D3", type: "Cellulosic / RNG", quantity: 230000, vintage: 2026, price: 0.95, seller: "Columbia River Gas Project", facility: "Columbia Wastewater RNG", qapProvider: "EcoEngineers", qapStatus: "Verified", orinGrade: "A+", riskScore: 12, satelliteStatus: "No major mismatch", recommendation: "Premium verified lot" },
  { id: "ORIN-D7-019", lat: 36.1699, lng: -115.1398, city: "Las Vegas, NV", dCode: "D7", type: "Cellulosic Diesel", quantity: 95000, vintage: 2026, price: 1.08, seller: "Mojave Advanced Fuels", facility: "Mojave Cellulosic Diesel", qapProvider: "Weaver and Tidwell", qapStatus: "Verified", orinGrade: "A", riskScore: 25, satelliteStatus: "No major mismatch", recommendation: "Suitable for purchase after standard review" },
  { id: "ORIN-D4-020", lat: 35.1495, lng: -90.049, city: "Memphis, TN", dCode: "D4", type: "Biomass-based Diesel", quantity: 530000, vintage: 2024, price: 0.72, seller: "Delta Biofuel Trading", facility: "Delta RD Terminal", qapProvider: "Missing", qapStatus: "Missing", orinGrade: "C", riskScore: 71, satelliteStatus: "Supply-chain review needed", recommendation: "Do not purchase without enhanced diligence" },
  { id: "ORIN-D6-021", lat: 43.0389, lng: -87.9065, city: "Milwaukee, WI", dCode: "D6", type: "Renewable Fuel / Ethanol", quantity: 410000, vintage: 2025, price: 0.38, seller: "Great Lakes Ethanol Desk", facility: "Great Lakes Corn Ethanol", qapProvider: "EcoEngineers", qapStatus: "Verified", orinGrade: "A", riskScore: 20, satelliteStatus: "No major mismatch", recommendation: "Suitable for purchase after standard review" },
  { id: "ORIN-D3-022", lat: 40.7128, lng: -74.006, city: "New York, NY", dCode: "D3", type: "Cellulosic / RNG", quantity: 155000, vintage: 2025, price: 0.86, seller: "Empire Renewable Trading", facility: "Fresh Kills RNG Legacy", qapProvider: "EcoEngineers", qapStatus: "Verified", orinGrade: "A", riskScore: 23, satelliteStatus: "No major mismatch", recommendation: "Suitable for purchase after standard review" },
];

interface SellerListing {
  id: string;
  lat: number;
  lng: number;
  city: string;
  dCode: string;
  type?: string;
  quantity: number;
  vintage?: number;
  price: number;
  seller: string;
  facility: string;
  qapProvider?: string;
  qapStatus?: string;
  orinGrade?: string;
  riskScore?: number;
  satelliteStatus?: string;
  recommendation?: string;
  source?: string;
  createdAt: string;
  ownerEmail?: string;
  notes?: string;
  // pass-through for crustdata enrichment etc.
  [k: string]: unknown;
}

function jsonResponse(status: number, payload: unknown) {
  return {
    statusCode: status,
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  };
}

function logEvent(payload: Record<string, unknown>) {
  try {
    console.log(JSON.stringify({ fn: "listings", ...payload }));
  } catch {
    /* ignore */
  }
}

function parseBody<T = unknown>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function asListing(raw: unknown): SellerListing | null {
  if (raw == null) return null;
  if (typeof raw !== "string") {
    if (typeof raw === "object") return raw as SellerListing;
    return null;
  }
  try {
    return JSON.parse(raw) as SellerListing;
  } catch {
    return null;
  }
}

// Strip "/.netlify/functions/listings" prefix and return remainder segments.
function parsePath(path: string | undefined): string[] {
  if (!path) return [];
  const trimmed = path.replace(/\/+$/, "");
  const idx = trimmed.indexOf("/listings");
  if (idx < 0) return [];
  const rest = trimmed.slice(idx + "/listings".length);
  if (!rest) return [];
  return rest.split("/").filter(Boolean);
}

const REQUIRED_FIELDS: Array<keyof SellerListing> = [
  "id",
  "lat",
  "lng",
  "dCode",
  "quantity",
  "price",
  "seller",
  "facility",
  "city",
];

function validateListing(raw: unknown):
  | { ok: true; value: SellerListing }
  | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "body must be a JSON object" };
  }
  const obj = raw as Record<string, unknown>;
  for (const f of REQUIRED_FIELDS) {
    const v = obj[f];
    if (v === undefined || v === null || v === "") {
      return { ok: false, error: `missing required field: ${f}` };
    }
  }
  if (typeof obj.id !== "string") {
    return { ok: false, error: "id must be a string" };
  }
  if (typeof obj.lat !== "number" || typeof obj.lng !== "number") {
    return { ok: false, error: "lat/lng must be numbers" };
  }
  if (typeof obj.quantity !== "number" || typeof obj.price !== "number") {
    return { ok: false, error: "quantity/price must be numbers" };
  }
  const listing = obj as unknown as SellerListing;
  if (!listing.createdAt) {
    listing.createdAt = new Date().toISOString();
  }
  if (!listing.source) {
    listing.source = "seller";
  }
  return { ok: true, value: listing };
}

// ---- Route handlers ---------------------------------------------------------

async function handleList() {
  const serverTime = new Date().toISOString();
  if (!isConfigured()) {
    logEvent({ op: "list", source: "no-upstash" });
    return jsonResponse(200, {
      listings: [],
      serverTime,
      source: "no-upstash",
    });
  }
  try {
    const ids = (await redis<string[]>(["SMEMBERS", KEY_SET])) ?? [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return jsonResponse(200, { listings: [], serverTime });
    }
    const cmds = ids.map((id) => ["GET", listingKey(id)]);
    const results = await pipeline(cmds);
    const listings: SellerListing[] = [];
    const stale: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      const rec = asListing(results[i]);
      if (!rec) {
        stale.push(ids[i]);
        continue;
      }
      listings.push(rec);
    }
    if (stale.length) {
      await redis(["SREM", KEY_SET, ...stale]).catch(() => {});
    }
    listings.sort((a, b) => {
      const ta = Date.parse(a.createdAt) || 0;
      const tb = Date.parse(b.createdAt) || 0;
      return tb - ta;
    });
    logEvent({ op: "list", count: listings.length });
    return jsonResponse(200, { listings, serverTime });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent({ op: "list", error: msg.slice(0, 200) });
    return jsonResponse(200, { listings: [], serverTime, source: "error" });
  }
}

async function handleCreate(event: Parameters<Handler>[0]) {
  const parsed = parseBody<unknown>(event.body);
  const v = validateListing(parsed);
  if (!v.ok) {
    return jsonResponse(400, { error: v.error });
  }
  const listing = v.value;

  if (!isConfigured()) {
    logEvent({ op: "create", id: listing.id, source: "no-upstash" });
    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ listing, source: "no-upstash" }),
    };
  }
  try {
    await pipeline([
      ["SET", listingKey(listing.id), JSON.stringify(listing)],
      ["SADD", KEY_SET, listing.id],
    ]);
    logEvent({ op: "create", id: listing.id });
    return {
      statusCode: 201,
      headers: JSON_HEADERS,
      body: JSON.stringify({ listing }),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent({ op: "create", id: listing.id, error: msg.slice(0, 200) });
    return jsonResponse(500, { error: "listing service error" });
  }
}

async function handleDeleteOne(id: string) {
  if (!isConfigured()) {
    return jsonResponse(200, { ok: true, source: "no-upstash" });
  }
  try {
    await pipeline([
      ["DEL", listingKey(id)],
      ["SREM", KEY_SET, id],
    ]);
    logEvent({ op: "delete", id });
    return jsonResponse(200, { ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent({ op: "delete", id, error: msg.slice(0, 200) });
    return jsonResponse(500, { error: "listing service error" });
  }
}

async function handleDeleteAll() {
  if (!isConfigured()) {
    return jsonResponse(200, { deleted: 0, source: "no-upstash" });
  }
  try {
    const ids = (await redis<string[]>(["SMEMBERS", KEY_SET])) ?? [];
    const cmds: (string | number)[][] = [];
    for (const id of ids) cmds.push(["DEL", listingKey(id)]);
    cmds.push(["DEL", KEY_SET]);
    if (cmds.length) await pipeline(cmds);
    logEvent({ op: "delete-all", count: ids.length });
    return jsonResponse(200, { deleted: ids.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent({ op: "delete-all", error: msg.slice(0, 200) });
    return jsonResponse(500, { error: "listing service error" });
  }
}

async function handleSeed() {
  if (!isConfigured()) {
    return jsonResponse(503, { error: "upstash not configured" });
  }
  try {
    const existingIds = (await redis<string[]>(["SMEMBERS", KEY_SET])) ?? [];
    const existing = new Set(existingIds);
    let inserted = 0;
    let skipped = 0;
    const cmds: (string | number)[][] = [];
    const now = Date.now();
    DEMO_CATALOG.forEach((entry, i) => {
      const id = entry.id as string;
      if (existing.has(id)) {
        skipped += 1;
        return;
      }
      const listing = {
        ...entry,
        createdAt: new Date(now - i * 86400_000).toISOString(),
        source: "demo",
      } as SellerListing;
      cmds.push(["SET", listingKey(id), JSON.stringify(listing)]);
      cmds.push(["SADD", KEY_SET, id]);
      inserted += 1;
    });
    if (cmds.length) await pipeline(cmds);
    logEvent({ op: "seed", inserted, skipped });
    return jsonResponse(200, { inserted, skipped });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent({ op: "seed", error: msg.slice(0, 200) });
    return jsonResponse(500, { error: "listing service error" });
  }
}

// ---- Dispatcher --------------------------------------------------------------

export const handler: Handler = async (event) => {
  const method = (event.httpMethod ?? "GET").toUpperCase();
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  let path = event.path ?? "";
  if (!path && event.rawUrl) {
    try {
      path = new URL(event.rawUrl).pathname;
    } catch {
      /* ignore */
    }
  }
  const segments = parsePath(path);

  try {
    if (segments.length === 0) {
      if (method === "GET") return await handleList();
      if (method === "POST") return await handleCreate(event);
      if (method === "DELETE") return await handleDeleteAll();
      return jsonResponse(405, { error: "method not allowed" });
    }
    const first = segments[0];
    if (first === "seed") {
      if (method === "POST") return await handleSeed();
      return jsonResponse(405, { error: "method not allowed" });
    }
    if (method === "DELETE") return await handleDeleteOne(first);
    return jsonResponse(405, { error: "method not allowed" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent({ error: msg.slice(0, 200) });
    return jsonResponse(500, { error: "listing service error" });
  }
};

export default handler;
