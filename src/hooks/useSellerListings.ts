import { useCallback, useEffect, useState } from "react";
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
  // small deterministic variance based on quantity last digits
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

export function useSellerListings() {
  const [listings, setListings] = useState<SellerListing[]>(() => safeRead());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setListings(safeRead());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: SellerListing[]) => {
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
      persist([next, ...listings]);
      return next;
    },
    [listings, persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(listings.filter((l) => l.id !== id));
    },
    [listings, persist],
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  return { listings, add, remove, clear };
}

export default useSellerListings;
