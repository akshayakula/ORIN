import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DCode,
  ORINGrade,
  QAPStatus,
  RinLot,
} from "../types/rin";
import type { CrustdataResult } from "../lib/crustdata";

export type SellerListing = RinLot & {
  createdAt: string;
  ownerEmail?: string;
  notes?: string;
  source: "seller";
  companyEnrichment?: CrustdataResult["company"];
  companyEnrichmentSource?: CrustdataResult["source"];
  companyEnrichmentStatus?: CrustdataResult["status"];
  companyEnrichedAt?: string;
  sellerVerifiedByCrustdata?: boolean;
};

const STORAGE_KEY = "orin.sellerListings";
const ENDPOINT = "/.netlify/functions/listings";
const REFRESH_MS = 30_000;

type AddInput = Omit<
  SellerListing,
  | "id"
  | "createdAt"
  | "source"
  | "riskScore"
  | "orinGrade"
  | "satelliteStatus"
  | "recommendation"
> & { id?: string };

function safeRead(): SellerListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SellerListing[];
  } catch {
    return [];
  }
}

function safeWrite(listings: SellerListing[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  } catch {
    // ignore quota / privacy errors
  }
}

function baseRiskFromQap(status: QAPStatus): number {
  switch (status) {
    case "Verified":
      return 22;
    case "Partial":
      return 55;
    case "Missing":
      return 72;
    case "Pending":
    default:
      return 45;
  }
}

function computeRiskScore(
  qapStatus: QAPStatus,
  quantity: number,
  price: number,
): number {
  let score = baseRiskFromQap(qapStatus);
  if (quantity > 500000) score += 4;
  if (quantity > 1000000) score += 4;
  if (price < 0.5) score += 8;
  else if (price < 0.7) score += 3;
  if (price > 3) score -= 2;
  const variance = ((quantity % 11) - 5);
  score += variance;
  return Math.max(5, Math.min(95, Math.round(score)));
}

function gradeFromRisk(risk: number): ORINGrade {
  if (risk <= 25) return "A";
  if (risk <= 40) return "B+";
  if (risk <= 60) return "B";
  if (risk <= 75) return "C+";
  return "C";
}

function sortByCreatedDesc(list: SellerListing[]): SellerListing[] {
  return list.slice().sort((a, b) => {
    const ta = Date.parse(a.createdAt) || 0;
    const tb = Date.parse(b.createdAt) || 0;
    return tb - ta;
  });
}

export function useSellerListings() {
  const [listings, setListings] = useState<SellerListing[]>(() => safeRead());
  const [loading, setLoading] = useState<boolean>(true);
  const inflightRef = useRef<AbortController | null>(null);
  const attemptedSeedRef = useRef(false);

  const fetchOnce = useCallback(async () => {
    inflightRef.current?.abort();
    const ctrl = new AbortController();
    inflightRef.current = ctrl;
    try {
      const res = await fetch(ENDPOINT, { signal: ctrl.signal });
      if (!res.ok) return;
      const data = (await res.json()) as {
        listings?: SellerListing[];
        source?: string;
      };
      if (!Array.isArray(data.listings)) return;
      // If server reports no-upstash (no persistence), keep local state
      if (data.source === "no-upstash" && data.listings.length === 0) {
        return;
      }
      const merged = sortByCreatedDesc(data.listings);
      setListings(merged);
      safeWrite(merged);
      // Bootstrap fresh Upstash environments by seeding demo lots once.
      if (merged.length === 0 && !attemptedSeedRef.current) {
        attemptedSeedRef.current = true;
        try {
          const seedRes = await fetch(`${ENDPOINT}/seed`, { method: "POST" });
          if (seedRes.ok) {
            const after = await fetch(ENDPOINT);
            if (after.ok) {
              const afterData = (await after.json()) as {
                listings?: SellerListing[];
              };
              if (Array.isArray(afterData.listings)) {
                const sorted = sortByCreatedDesc(afterData.listings);
                setListings(sorted);
                safeWrite(sorted);
              }
            }
          }
        } catch {
          /* best-effort seed */
        }
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      // Network failure — keep local
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount + visibility-aware polling
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (!active) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void fetchOnce();
    };

    void fetchOnce();
    timer = setInterval(tick, REFRESH_MS);

    const onVis = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void fetchOnce();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis);
    }

    return () => {
      active = false;
      if (timer) clearInterval(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVis);
      }
      inflightRef.current?.abort();
    };
  }, [fetchOnce]);

  // Cross-tab sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setListings(safeRead());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persistLocal = useCallback((next: SellerListing[]) => {
    setListings(next);
    safeWrite(next);
  }, []);

  const add = useCallback(
    (input: AddInput): SellerListing => {
      const dCode = input.dCode as DCode;
      const riskScore = computeRiskScore(
        input.qapStatus,
        input.quantity,
        input.price,
      );
      const orinGrade = gradeFromRisk(riskScore);
      const id =
        input.id ??
        `ORIN-${dCode}-SELLER-${Date.now().toString(36).toUpperCase()}`;
      const next: SellerListing = {
        id,
        lat: input.lat,
        lng: input.lng,
        city: input.city,
        dCode,
        type: input.type,
        quantity: input.quantity,
        vintage: input.vintage,
        price: input.price,
        seller: input.seller,
        facility: input.facility,
        qapProvider: input.qapProvider,
        qapStatus: input.qapStatus,
        orinGrade,
        riskScore,
        satelliteStatus: "Pending ORIN satellite review",
        recommendation: "Pending ORIN Integrity Audit",
        createdAt: new Date().toISOString(),
        ownerEmail: input.ownerEmail,
        notes: input.notes,
        source: "seller",
        companyEnrichment: input.companyEnrichment,
        companyEnrichmentSource: input.companyEnrichmentSource,
        companyEnrichmentStatus: input.companyEnrichmentStatus,
        companyEnrichedAt: input.companyEnrichedAt,
        sellerVerifiedByCrustdata: input.sellerVerifiedByCrustdata,
      };
      // Optimistic local
      setListings((prev) => {
        const merged = [next, ...prev.filter((p) => p.id !== next.id)];
        safeWrite(merged);
        return merged;
      });
      // Fire-and-forget POST
      void (async () => {
        try {
          const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
          if (!res.ok) {
            console.warn(
              "[useSellerListings] POST failed",
              res.status,
              await res.text().catch(() => ""),
            );
          }
        } catch (err) {
          console.warn("[useSellerListings] POST error", err);
        }
      })();
      return next;
    },
    [],
  );

  const remove = useCallback(
    (id: string) => {
      setListings((prev) => {
        const filtered = prev.filter((l) => l.id !== id);
        safeWrite(filtered);
        return filtered;
      });
      void (async () => {
        try {
          await fetch(`${ENDPOINT}/${encodeURIComponent(id)}`, {
            method: "DELETE",
          });
        } catch {
          /* best-effort */
        }
      })();
    },
    [],
  );

  const clear = useCallback(() => {
    persistLocal([]);
  }, [persistLocal]);

  const refresh = useCallback(async () => {
    await fetchOnce();
  }, [fetchOnce]);

  return { listings, add, remove, clear, refresh, loading };
}

export default useSellerListings;
