// Client helper for the Crustdata company enrichment proxy.
//
// Always returns a result object — even when the network is unavailable or
// both proxy paths fail it falls back to a deterministic mock so the demo UI
// can still render. Attribution: "Verified via Crustdata".

export interface CrustdataHeadcountPoint {
  date: string;
  count: number;
}

export interface CrustdataCompany {
  id?: number | string;
  name?: string;
  domain?: string;
  website?: string;
  description?: string;
  linkedinUrl?: string;
  hqCountry?: string;
  hqAddress?: string;
  yearFounded?: number;
  employeeCount?: number;
  headcountSeries?: CrustdataHeadcountPoint[];
  taxonomy?: { industries?: string[]; sectors?: string[]; tags?: string[] };
  markets?: string[];
  offices?: string[];
}

export type CrustdataStatus =
  | "found"
  | "enriching"
  | "not_found"
  | "error"
  | "mock";

export interface CrustdataResult {
  query: { domain?: string; name?: string };
  found: boolean;
  status: CrustdataStatus;
  company: CrustdataCompany;
  source: "live" | "mock";
  fetchedAt: string;
}

const ENDPOINTS = [
  "/.netlify/functions/crustdata",
  "/api/crustdata",
];

function seedFrom(input: string): number {
  return Math.abs(
    Array.from(input).reduce((s, c) => s + c.charCodeAt(0), 0),
  );
}

export function mockLookup(name: string): CrustdataResult {
  const display = name.trim() || "Unknown Company";
  const seed = seedFrom(display.toLowerCase());
  const employees = 50 + (seed % 450);
  const series: CrustdataHeadcountPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    series.push({
      date: d.toISOString().slice(0, 10),
      count: Math.max(1, employees - i * 4 + ((seed + i) % 6)),
    });
  }
  const slug = display
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return {
    query: { name: display },
    found: true,
    status: "mock",
    company: {
      id: `mock-${seed}`,
      name: display,
      domain: `${slug}.com`,
      website: `https://${slug}.com`,
      description:
        "Renewable fuels operator with publicly reported RIN generation activity.",
      linkedinUrl: `https://linkedin.com/company/${slug}`,
      hqCountry: "United States",
      hqAddress: "Houston, Texas, United States",
      yearFounded: 1995 + (seed % 28),
      employeeCount: employees,
      headcountSeries: series,
      taxonomy: {
        industries: ["Renewable Energy", "Biofuels"],
        sectors: ["Energy"],
        tags: ["Renewable", "Sustainability"],
      },
      markets: [],
      offices: ["Houston, TX, US"],
    },
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
}

function buildQuery(input: { domain?: string; name?: string }): string {
  const params = new URLSearchParams();
  const domain = input.domain?.trim();
  const name = input.name?.trim();
  if (domain) params.set("domain", domain);
  if (name && !domain) params.set("name", name);
  return params.toString();
}

async function tryEndpoint(
  base: string,
  qs: string,
  signal?: AbortSignal,
): Promise<CrustdataResult | null> {
  try {
    const res = await fetch(`${base}?${qs}`, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!data || typeof data !== "object") return null;
    if (!("status" in data) || !("company" in data)) return null;
    return data as CrustdataResult;
  } catch {
    return null;
  }
}

export async function lookupCompany(
  input: { domain?: string; name?: string },
  signal?: AbortSignal,
): Promise<CrustdataResult> {
  const domain = input.domain?.trim();
  const name = input.name?.trim();
  if (!domain && !name) {
    return mockLookup("");
  }
  const qs = buildQuery({ domain, name });
  for (const base of ENDPOINTS) {
    const r = await tryEndpoint(base, qs, signal);
    if (r) return r;
  }
  return mockLookup(name ?? domain ?? "");
}
