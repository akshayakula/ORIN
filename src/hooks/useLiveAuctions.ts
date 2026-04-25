import { useCallback, useEffect, useRef, useState } from "react";
import type { AuctionRecord } from "../types/auction";
import { listLiveAuctions } from "../lib/auctions";

const POLL_MS = 4000;

export interface UseLiveAuctionsResult {
  auctions: AuctionRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLiveAuctions(): UseLiveAuctionsResult {
  const [auctions, setAuctions] = useState<AuctionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef<AbortController | null>(null);

  const fetchOnce = useCallback(async () => {
    inflightRef.current?.abort();
    const ctrl = new AbortController();
    inflightRef.current = ctrl;
    try {
      const { auctions: list } = await listLiveAuctions(ctrl.signal);
      const now = Date.now();
      const filtered = list.filter((a) => {
        const exp = Date.parse(a.expiresAt);
        return Number.isFinite(exp) ? exp >= now : true;
      });
      setAuctions(filtered);
      setError(null);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setError((err as Error)?.message ?? "fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (!active) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void fetchOnce();
    };

    void fetchOnce();
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
  }, [fetchOnce]);

  return { auctions, loading, error, refresh: fetchOnce };
}

export default useLiveAuctions;
