// ORIN — live auction routes backed by Upstash Redis (REST).
// Single function dispatches POST/GET/DELETE on /auctions and /auctions/:id[/...]

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

const AUCTION_TTL = 305; // 5min + small grace
const ENDED_TTL = 60;
const LIVE_SET_TTL = 600;
const LIVE_DURATION_MS = 5 * 60 * 1000;

interface AuctionRecord {
  auctionId: string;
  listingId: string;
  sellerCompany: string;
  dCode: string;
  quantity: number;
  startPrice: number;
  topBid: number;
  topBidderCompany: string | null;
  bidCount: number;
  status: "live" | "ended" | "expired";
  startedByCompany: string;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  winnerCompany: string | null;
}

interface BidRecord {
  company: string;
  amount: number;
  at: string;
}

const KEY_LIVE = "orin:auctions:live";
const auctionKey = (id: string) => `orin:auction:${id}`;
const bidsKey = (id: string) => `orin:auction:${id}:bids`;

function jsonResponse(status: number, payload: unknown) {
  return {
    statusCode: status,
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  };
}

function makeAuctionId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `AUC-${ts}-${rand}`;
}

function parseBody<T = unknown>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function asAuction(raw: unknown): AuctionRecord | null {
  if (raw == null) return null;
  if (typeof raw !== "string") {
    if (typeof raw === "object") return raw as AuctionRecord;
    return null;
  }
  try {
    return JSON.parse(raw) as AuctionRecord;
  } catch {
    return null;
  }
}

function asBid(raw: unknown): BidRecord | null {
  if (raw == null) return null;
  if (typeof raw !== "string") {
    if (typeof raw === "object") return raw as BidRecord;
    return null;
  }
  try {
    return JSON.parse(raw) as BidRecord;
  } catch {
    return null;
  }
}

// Strip "/.netlify/functions/auctions" or matching prefix and return remainder segments.
function parsePath(path: string | undefined): string[] {
  if (!path) return [];
  const trimmed = path.replace(/\/+$/, "");
  const idx = trimmed.indexOf("/auctions");
  if (idx < 0) return [];
  const rest = trimmed.slice(idx + "/auctions".length);
  if (!rest) return [];
  return rest.split("/").filter(Boolean);
}

async function getAuction(id: string): Promise<AuctionRecord | null> {
  const raw = await redis<unknown>(["GET", auctionKey(id)]);
  return asAuction(raw);
}

async function persistAuction(rec: AuctionRecord, ttl = AUCTION_TTL): Promise<void> {
  await redis(["SET", auctionKey(rec.auctionId), JSON.stringify(rec), "EX", ttl]);
}

// ---- Route handlers ---------------------------------------------------------

async function handleCreate(event: Parameters<Handler>[0]) {
  if (!isConfigured()) {
    return jsonResponse(503, { error: "upstash not configured" });
  }
  const body = parseBody<{ lot?: Record<string, unknown>; startedByCompany?: string }>(event.body);
  if (!body || !body.lot || typeof body.startedByCompany !== "string" || !body.startedByCompany.trim()) {
    return jsonResponse(400, { error: "missing lot or startedByCompany" });
  }
  const lot = body.lot;
  const id = String(lot.id ?? "");
  const seller = String(lot.seller ?? "");
  const dCode = String(lot.dCode ?? "");
  const quantity = Number(lot.quantity);
  const price = Number(lot.price);
  if (!id || !seller || !dCode || !Number.isFinite(quantity) || !Number.isFinite(price)) {
    return jsonResponse(400, {
      error: "lot.id, lot.seller, lot.dCode, lot.quantity, lot.price are required",
    });
  }

  const auctionId = makeAuctionId();
  const now = new Date();
  const expires = new Date(now.getTime() + LIVE_DURATION_MS);
  const record: AuctionRecord = {
    auctionId,
    listingId: id,
    sellerCompany: seller,
    dCode,
    quantity,
    startPrice: round2(price),
    topBid: round2(price),
    topBidderCompany: null,
    bidCount: 0,
    status: "live",
    startedByCompany: body.startedByCompany.trim(),
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    endedAt: null,
    winnerCompany: null,
  };

  await pipeline([
    ["SET", auctionKey(auctionId), JSON.stringify(record), "EX", AUCTION_TTL],
    ["SADD", KEY_LIVE, auctionId],
    ["EXPIRE", KEY_LIVE, LIVE_SET_TTL],
    ["DEL", bidsKey(auctionId)],
  ]);

  return { statusCode: 201, headers: JSON_HEADERS, body: JSON.stringify({ auction: record }) };
}

async function handleListLive() {
  if (!isConfigured()) {
    return jsonResponse(200, { auctions: [], serverTime: new Date().toISOString() });
  }
  const ids = (await redis<string[]>(["SMEMBERS", KEY_LIVE])) ?? [];
  if (!Array.isArray(ids) || ids.length === 0) {
    return jsonResponse(200, { auctions: [], serverTime: new Date().toISOString() });
  }
  const cmds = ids.map((id) => ["GET", auctionKey(id)]);
  const results = await pipeline(cmds);
  const now = Date.now();
  const auctions: AuctionRecord[] = [];
  const expiredIds: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    const rec = asAuction(results[i]);
    if (!rec) {
      expiredIds.push(ids[i]);
      continue;
    }
    const exp = Date.parse(rec.expiresAt);
    if (Number.isFinite(exp) && exp < now) {
      expiredIds.push(rec.auctionId);
      continue;
    }
    if (rec.status !== "live") {
      expiredIds.push(rec.auctionId);
      continue;
    }
    auctions.push(rec);
  }
  if (expiredIds.length) {
    await redis(["SREM", KEY_LIVE, ...expiredIds]).catch(() => {});
  }
  return jsonResponse(200, {
    auctions,
    serverTime: new Date().toISOString(),
  });
}

async function handleGetOne(id: string) {
  if (!isConfigured()) {
    return jsonResponse(503, { error: "upstash not configured" });
  }
  const [auctionRaw, bidsRaw] = await pipeline([
    ["GET", auctionKey(id)],
    ["LRANGE", bidsKey(id), 0, 49],
  ]);
  const auction = asAuction(auctionRaw);
  if (!auction) {
    return jsonResponse(404, { error: "auction not found" });
  }
  const bidsArr = Array.isArray(bidsRaw) ? (bidsRaw as unknown[]) : [];
  const bids: BidRecord[] = bidsArr
    .map((b) => asBid(b))
    .filter((b): b is BidRecord => b !== null);
  return jsonResponse(200, { auction, bids });
}

async function handleBid(id: string, event: Parameters<Handler>[0]) {
  if (!isConfigured()) {
    return jsonResponse(503, { error: "upstash not configured" });
  }
  const body = parseBody<{ company?: string; amount?: number }>(event.body);
  if (!body || typeof body.company !== "string" || !body.company.trim()) {
    return jsonResponse(400, { error: "company is required" });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return jsonResponse(400, { error: "amount must be a positive number" });
  }
  const auction = await getAuction(id);
  if (!auction) return jsonResponse(404, { error: "auction not found" });

  const now = Date.now();
  const expMs = Date.parse(auction.expiresAt);
  if (auction.status !== "live" || (Number.isFinite(expMs) && expMs < now)) {
    auction.status = "expired";
    await redis(["SREM", KEY_LIVE, id]).catch(() => {});
    return {
      statusCode: 410,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: "auction not live", auction }),
    };
  }

  const newAmount = round2(amount);
  if (newAmount <= auction.topBid) {
    return {
      statusCode: 409,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        error: "bid must exceed current top bid",
        topBid: auction.topBid,
        topBidderCompany: auction.topBidderCompany,
      }),
    };
  }

  const company = body.company.trim();
  auction.topBid = newAmount;
  auction.topBidderCompany = company;
  auction.bidCount += 1;

  const bid: BidRecord = {
    company,
    amount: newAmount,
    at: new Date().toISOString(),
  };

  await pipeline([
    ["SET", auctionKey(id), JSON.stringify(auction), "EX", AUCTION_TTL],
    ["LPUSH", bidsKey(id), JSON.stringify(bid)],
    ["LTRIM", bidsKey(id), 0, 49],
    ["EXPIRE", bidsKey(id), AUCTION_TTL],
  ]);

  return jsonResponse(200, { auction });
}

async function handleEnd(id: string, event: Parameters<Handler>[0]) {
  if (!isConfigured()) {
    return jsonResponse(503, { error: "upstash not configured" });
  }
  const body = parseBody<{ company?: string }>(event.body);
  if (!body || typeof body.company !== "string" || !body.company.trim()) {
    return jsonResponse(400, { error: "company is required" });
  }
  const auction = await getAuction(id);
  if (!auction) return jsonResponse(404, { error: "auction not found" });

  if (auction.sellerCompany.trim().toLowerCase() !== body.company.trim().toLowerCase()) {
    return jsonResponse(403, { error: "only the seller can end this auction" });
  }

  auction.status = "ended";
  auction.endedAt = new Date().toISOString();
  auction.winnerCompany = auction.topBidderCompany;

  await pipeline([
    ["SET", auctionKey(id), JSON.stringify(auction), "EX", ENDED_TTL],
    ["SREM", KEY_LIVE, id],
  ]);

  return jsonResponse(200, { auction });
}

async function handleDeleteOne(id: string) {
  if (!isConfigured()) {
    return jsonResponse(503, { error: "upstash not configured" });
  }
  await pipeline([
    ["DEL", auctionKey(id)],
    ["DEL", bidsKey(id)],
    ["SREM", KEY_LIVE, id],
  ]);
  return jsonResponse(200, { ok: true });
}

async function handleDeleteAll() {
  if (!isConfigured()) {
    return jsonResponse(503, { error: "upstash not configured" });
  }
  const ids = (await redis<string[]>(["SMEMBERS", KEY_LIVE])) ?? [];
  const cmds: (string | number)[][] = [];
  for (const id of ids) {
    cmds.push(["DEL", auctionKey(id)]);
    cmds.push(["DEL", bidsKey(id)]);
  }
  cmds.push(["DEL", KEY_LIVE]);
  if (cmds.length) await pipeline(cmds);
  return jsonResponse(200, { deleted: ids.length });
}

// ---- Dispatcher --------------------------------------------------------------

export const handler: Handler = async (event) => {
  const method = (event.httpMethod ?? "GET").toUpperCase();
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  // Prefer event.path; fall back to URL path.
  let path = event.path ?? "";
  if (!path && event.rawUrl) {
    try {
      path = new URL(event.rawUrl).pathname;
    } catch {
      /* ignore */
    }
  }

  const segments = parsePath(path);
  // segments: [] | [id] | [id, "bid"] | [id, "end"]

  try {
    if (segments.length === 0) {
      if (method === "GET") return await handleListLive();
      if (method === "POST") return await handleCreate(event);
      if (method === "DELETE") return await handleDeleteAll();
      return jsonResponse(405, { error: "method not allowed" });
    }
    const id = segments[0];
    if (segments.length === 1) {
      if (method === "GET") return await handleGetOne(id);
      if (method === "DELETE") return await handleDeleteOne(id);
      return jsonResponse(405, { error: "method not allowed" });
    }
    const action = segments[1];
    if (action === "bid" && method === "POST") return await handleBid(id, event);
    if (action === "end" && method === "POST") return await handleEnd(id, event);
    return jsonResponse(404, { error: "unknown route" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(JSON.stringify({ fn: "auctions", error: msg.slice(0, 200) }));
    return jsonResponse(500, { error: "auction service error" });
  }
};

export default handler;
