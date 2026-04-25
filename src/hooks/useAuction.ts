import { useCallback, useEffect, useRef, useState } from "react";
import type { AuctionRecord, BidRecord } from "../types/auction";
import { getAuction } from "../lib/auctions";

const POLL_MS = 1500;

export interface UseAuctionResult {
  auction: AuctionRecord | null;
  bids: BidRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAuction(id: string | null): UseAuctionResult {
  const [auction, setAuction] = useState<AuctionRecord | null>(null);
  const [bids, setBids] = useState<BidRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef<AbortController | null>(null);

  const fetchOnce = useCallback(async () => {
    if (!id) return;
    inflightRef.current?.abort();
    const ctrl = new AbortController();
    inflightRef.current = ctrl;
    try {
      const data = await getAuction(id, ctrl.signal);
      setAuction(data.auction);
      setBids(data.bids ?? []);
      setError(null);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setError((err as Error)?.message ?? "fetch failed");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setAuction(null);
      setBids([]);
      setError(null);
      return;
    }
    setLoading(true);
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    void fetchOnce();
    const tick = () => {
      if (!active) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void fetchOnce();
    };
    timer = setInterval(tick, POLL_MS);

    const onVis = () => {
      if (document.visibilityState === "visible") void fetchOnce();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      inflightRef.current?.abort();
    };
  }, [id, fetchOnce]);

  return { auction, bids, loading, error, refresh: fetchOnce };
}

export default useAuction;
