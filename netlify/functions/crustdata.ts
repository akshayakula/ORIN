// ORIN Netlify Function: Crustdata company enrichment proxy.
//
// Looks up a company (by domain or name) via Crustdata's
// `GET /screener/company` endpoint and returns a trimmed shape that the
// ORIN UI can render directly. Falls back to deterministic mock data when
// the token is missing or upstream errors so the demo never breaks.
//
// Docs: https://fulldocs.crustdata.com — explicit attribution required
// wherever this data is shown ("Verified via Crustdata").

type Handler = (event: {
  queryStringParameters?: Record<string, string | undefined>;
  httpMethod?: string;
  body?: string | null;
}) => Promise<{
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}>;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Default field set — covers what the buyer/seller UI surfaces. Uses
// dot-notation for nested headcount/taxonomy fields per Crustdata spec.
const DEFAULT_FIELDS = [
  "company_id",
  "company_name",
  "company_website",
  "company_website_domain",
  "hq_country",
  "hq_street_address",
  "headquarters",
  "year_founded",
  "linkedin_profile_url",
  "linkedin_company_description",
  "all_office_addresses",
  "markets",
  "acquisition_status",
  "headcount",
  "taxonomy",
].join(",");

interface HeadcountPoint {
  date: string;
  count: number;
}

interface TrimmedCompany {
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
  headcountSeries?: HeadcountPoint[];
  taxonomy?: { industries?: string[]; sectors?: string[]; tags?: string[] };
  markets?: string[];
  offices?: string[];
}

type CrustdataStatus = "found" | "enriching" | "not_found" | "error" | "mock";

interface UniformResult {
  query: { domain?: string; name?: string };
  found: boolean;
  status: CrustdataStatus;
  company: TrimmedCompany;
  source: "live" | "mock";
  fetchedAt: string;
}

const cache = new Map<string, { at: number; payload: UniformResult }>();
const TTL_MS = 10 * 60 * 1000;

function jsonHeaders(source: UniformResult["source"]) {
  return {
    ...CORS_HEADERS,
    "Content-Type": "application/json",
    "Cache-Control":
      source === "live" ? "public, max-age=600" : "public, max-age=60",
  };
}

function logEvent(entry: Record<string, unknown>) {
  try {
    console.log(JSON.stringify({ fn: "crustdata", ...entry }));
  } catch {
    /* no-op */
  }
}

function seedFrom(input: string): number {
  return Math.abs(
    Array.from(input).reduce((s, c) => s + c.charCodeAt(0), 0),
  );
}

function mockResult(
  domain: string | undefined,
  name: string | undefined,
): UniformResult {
  const display =
    name ??
    (domain ? domain.replace(/\.(com|io|co|net|org)$/i, "") : "Unknown Company");
  const seed = seedFrom(display.toLowerCase());
  const employees = 50 + (seed % 450);
  const series: HeadcountPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    series.push({
      date: d.toISOString().slice(0, 10),
      count: Math.max(1, employees - i * 4 + ((seed + i) % 6)),
    });
  }
  return {
    query: { domain, name },
    found: true,
    status: "mock",
    company: {
      id: `mock-${seed}`,
      name: display,
      domain,
      website: domain ? `https://${domain}` : undefined,
      description:
        "Renewable fuels operator with publicly reported RIN generation activity.",
      linkedinUrl: `https://linkedin.com/company/${display
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")}`,
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

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x): x is string => typeof x === "string" && x.length > 0);
  return out.length ? out : undefined;
}

function parseYearFounded(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const m = v.match(/(\d{4})/);
    if (m) {
      const n = Number(m[1]);
      if (n > 1700 && n < 2100) return n;
    }
  }
  return undefined;
}

function trimHeadcountSeries(series: unknown): HeadcountPoint[] | undefined {
  if (!Array.isArray(series)) return undefined;
  const points: HeadcountPoint[] = [];
  for (const raw of series) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const date = asString(r.date);
    const count =
      typeof r.employee_count === "number"
        ? r.employee_count
        : typeof r.count === "number"
          ? r.count
          : undefined;
    if (date && typeof count === "number") points.push({ date, count });
  }
  if (!points.length) return undefined;
  // Already sorted ascending in spec; take last 12.
  return points.slice(-12);
}

function trimTaxonomy(tax: unknown): TrimmedCompany["taxonomy"] | undefined {
  if (!tax || typeof tax !== "object") return undefined;
  const t = tax as Record<string, unknown>;
  const industries =
    asStringArray(t.linkedin_industries) ??
    (asString(t.linkedin_industry) ? [asString(t.linkedin_industry)!] : undefined);
  const sectors = (() => {
    const naics = t.primary_naics_detail;
    if (naics && typeof naics === "object") {
      const n = naics as Record<string, unknown>;
      const sec = asString(n.sector);
      if (sec) return [sec];
    }
    return undefined;
  })();
  const tags =
    asStringArray(t.crunchbase_categories) ??
    asStringArray(t.linkedin_specialities);
  if (!industries && !sectors && !tags) return undefined;
  return {
    ...(industries ? { industries: industries.slice(0, 12) } : {}),
    ...(sectors ? { sectors } : {}),
    ...(tags ? { tags: tags.slice(0, 12) } : {}),
  };
}

function trimCompany(
  row: Record<string, unknown>,
  fallback: { domain?: string; name?: string },
): TrimmedCompany {
  const headcount =
    row.headcount && typeof row.headcount === "object"
      ? (row.headcount as Record<string, unknown>)
      : undefined;
  const linkedinHeadcount =
    typeof headcount?.linkedin_headcount === "number"
      ? (headcount.linkedin_headcount as number)
      : undefined;
  return {
    id:
      typeof row.company_id === "number" || typeof row.company_id === "string"
        ? (row.company_id as number | string)
        : undefined,
    name: asString(row.company_name) ?? fallback.name,
    domain: asString(row.company_website_domain) ?? fallback.domain,
    website: asString(row.company_website),
    description: asString(row.linkedin_company_description),
    linkedinUrl: asString(row.linkedin_profile_url),
    hqCountry: asString(row.hq_country),
    hqAddress: asString(row.hq_street_address) ?? asString(row.headquarters),
    yearFounded: parseYearFounded(row.year_founded),
    employeeCount: linkedinHeadcount,
    headcountSeries: trimHeadcountSeries(headcount?.linkedin_headcount_timeseries),
    taxonomy: trimTaxonomy(row.taxonomy),
    markets: asStringArray(row.markets),
    offices: asStringArray(row.all_office_addresses)?.slice(0, 12),
  };
}

interface FetchOptions {
  domain?: string;
  name?: string;
  enrichRealtime: boolean;
}

async function fetchCrustdata(opts: FetchOptions): Promise<UniformResult> {
  const t0 = Date.now();
  const { domain, name, enrichRealtime } = opts;
  const token = process.env.CRUSTDATA_TOKEN;
  if (!token) {
    logEvent({ stage: "key-missing", note: "CRUSTDATA_TOKEN not set" });
    return mockResult(domain, name);
  }

  const url = new URL("https://api.crustdata.com/screener/company");
  if (domain) url.searchParams.set("company_domain", domain);
  if (name && !domain) url.searchParams.set("company_name", name);
  url.searchParams.set("fields", DEFAULT_FIELDS);
  if (enrichRealtime) url.searchParams.set("enrich_realtime", "true");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const ms = Date.now() - t0;

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      logEvent({
        stage: "upstream-error",
        status: res.status,
        ms,
        note: txt.slice(0, 200),
      });
      return {
        ...mockResult(domain, name),
        status: "error",
      };
    }

    const data = (await res.json()) as unknown;
    const rows: unknown[] = Array.isArray(data)
      ? data
      : data && typeof data === "object" && Array.isArray((data as { results?: unknown[] }).results)
        ? ((data as { results: unknown[] }).results as unknown[])
        : data && typeof data === "object"
          ? [data]
          : [];

    const first = rows[0];
    if (!first || typeof first !== "object") {
      logEvent({ stage: "empty-response", ms });
      return {
        query: { domain, name },
        found: false,
        status: "not_found",
        company: { name, domain },
        source: "live",
        fetchedAt: new Date().toISOString(),
      };
    }

    const row = first as Record<string, unknown>;

    // Crustdata may return a status row indicating the company is being
    // enriched or was not found.
    const statusStr = asString(row.status);
    if (statusStr === "enriching") {
      logEvent({ stage: "enriching", ms });
      return {
        query: { domain, name },
        found: false,
        status: "enriching",
        company: { name, domain },
        source: "live",
        fetchedAt: new Date().toISOString(),
      };
    }
    if (statusStr === "not_found") {
      logEvent({ stage: "not-found", ms });
      return {
        query: { domain, name },
        found: false,
        status: "not_found",
        company: { name, domain },
        source: "live",
        fetchedAt: new Date().toISOString(),
      };
    }

    logEvent({ stage: "ok", ms, note: asString(row.company_name) });
    return {
      query: { domain, name },
      found: true,
      status: "found",
      company: trimCompany(row, { domain, name }),
      source: "live",
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timeout);
    const ms = Date.now() - t0;
    const note = String((err as Error)?.message ?? err).slice(0, 200);
    logEvent({ stage: "fetch-error", ms, note });
    return {
      ...mockResult(domain, name),
      status: "error",
    };
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const qs = event.queryStringParameters ?? {};
  const domainRaw = qs.domain?.trim();
  const nameRaw = qs.name?.trim();
  const domain = domainRaw && domainRaw.length > 0 ? domainRaw : undefined;
  const name = nameRaw && nameRaw.length > 0 ? nameRaw : undefined;

  if (!domain && !name) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Provide ?domain= or ?name= in the query string.",
        example:
          "/.netlify/functions/crustdata?domain=hubspot.com or ?name=NorthStar%20Renewable%20Fuels",
      }),
    };
  }

  const enrichRealtimeQs = qs.enrich_realtime;
  // Default to true so demo always returns *something* fresh, but only when
  // we actually have a token (otherwise it's mock anyway).
  const tokenPresent = Boolean(process.env.CRUSTDATA_TOKEN);
  const enrichRealtime =
    enrichRealtimeQs === undefined
      ? tokenPresent
      : enrichRealtimeQs === "true" || enrichRealtimeQs === "1";

  const key = `${domain ?? ""}|${name ?? ""}`.toLowerCase();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.at < TTL_MS) {
    logEvent({ stage: "cache-hit", note: key });
    return {
      statusCode: 200,
      headers: jsonHeaders(cached.payload.source),
      body: JSON.stringify(cached.payload),
    };
  }

  const payload = await fetchCrustdata({ domain, name, enrichRealtime });
  cache.set(key, { at: now, payload });

  return {
    statusCode: 200,
    headers: jsonHeaders(payload.source),
    body: JSON.stringify(payload),
  };
};
