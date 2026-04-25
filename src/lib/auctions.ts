import type { AuctionRecord, BidRecord } from "../types/auction";
import type { RinLot } from "../types/rin";

const BASE = "/.netlify/functions/auctions";

async function request<T>(
  url: string,
  init?: RequestInit & { signal?: AbortSignal },
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep parsed = null */
    }
  }
  if (!res.ok) {
    const errMsg =
      (parsed && typeof parsed === "object" && "error" in parsed
        ? String((parsed as Record<string, unknown>).error)
        : null) ?? `request failed ${res.status}`;
    throw new Error(errMsg);
  }
  return parsed as T;
}

export interface ListLiveResponse {
  auctions: AuctionRecord[];
  serverTime: string;
}

export function listLiveAuctions(signal?: AbortSignal): Promise<ListLiveResponse> {
  return request<ListLiveResponse>(BASE, { method: "GET", signal });
}

export interface StartAuctionInput {
  lot: RinLot;
  startedByCompany: string;
}

export async function startAuction(
  input: StartAuctionInput,
  signal?: AbortSignal,
): Promise<AuctionRecord> {
  const data = await request<{ auction: AuctionRecord }>(BASE, {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
  return data.auction;
}

export interface AuctionDetail {
  auction: AuctionRecord;
  bids: BidRecord[];
}

export function getAuction(
  id: string,
  signal?: AbortSignal,
): Promise<AuctionDetail> {
  return request<AuctionDetail>(`${BASE}/${encodeURIComponent(id)}`, {
    method: "GET",
    signal,
  });
}

export interface PlaceBidInput {
  company: string;
  amount: number;
}

export async function placeBid(
  id: string,
  input: PlaceBidInput,
  signal?: AbortSignal,
): Promise<AuctionRecord> {
  const data = await request<{ auction: AuctionRecord }>(
    `${BASE}/${encodeURIComponent(id)}/bid`,
    {
      method: "POST",
      body: JSON.stringify(input),
      signal,
    },
  );
  return data.auction;
}

export async function endAuction(
  id: string,
  input: { company: string },
  signal?: AbortSignal,
): Promise<AuctionRecord> {
  const data = await request<{ auction: AuctionRecord }>(
    `${BASE}/${encodeURIComponent(id)}/end`,
    {
      method: "POST",
      body: JSON.stringify(input),
      signal,
    },
  );
  return data.auction;
}

export async function cancelAuction(id: string, signal?: AbortSignal): Promise<void> {
  await request<{ ok: boolean }>(`${BASE}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    signal,
  });
}
