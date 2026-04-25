import { useCallback, useEffect, useState } from "react";
import type { CrustdataResult } from "../lib/crustdata";

export interface BuyerProfile {
  name: string;
  email?: string;
  companyName: string;
  companyDomain?: string;
  enrichment?: CrustdataResult["company"];
  enrichmentSource?: "live" | "mock";
  enrichmentStatus?: CrustdataResult["status"];
  enrichedAt?: string;
}

const KEY = "orin.buyerProfile";

function isProfile(v: unknown): v is BuyerProfile {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.name === "string" && typeof o.companyName === "string"
  );
}

function read(): BuyerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function write(profile: BuyerProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (profile === null) {
      window.localStorage.removeItem(KEY);
    } else {
      window.localStorage.setItem(KEY, JSON.stringify(profile));
    }
  } catch {
    /* ignore */
  }
}

export function useBuyerProfile() {
  const [profile, setProfileState] = useState<BuyerProfile | null>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setProfileState(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setProfile = useCallback((p: BuyerProfile) => {
    write(p);
    setProfileState(p);
  }, []);

  const clear = useCallback(() => {
    write(null);
    setProfileState(null);
  }, []);

  return { profile, setProfile, clear };
}
