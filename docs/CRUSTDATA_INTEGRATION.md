# Crustdata Company Enrichment Integration

ORIN uses [Crustdata](https://fulldocs.crustdata.com) for live company
enrichment in both the buyer onboarding flow and the seller listing flow.
This doc covers the proxy function, the field set we request, the response
transform, and the demo-safe fallback policy.

> Attribution: anywhere this data is shown the UI must include
> "Powered by Crustdata" / "Verified via Crustdata" with a link to
> `fulldocs.crustdata.com`. The `CompanyLookupField` component renders this
> automatically.

## Endpoint shape

We call a single Crustdata endpoint:

```
GET https://api.crustdata.com/screener/company
Authorization: Bearer ${CRUSTDATA_TOKEN}
Accept: application/json
```

The proxy lives at `/.netlify/functions/crustdata` (also reachable via
`/api/crustdata` thanks to the `[[redirects]]` rule in `netlify.toml`).

Query params accepted by the proxy:

| Param             | Notes                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| `domain`          | e.g. `hubspot.com`. Forwarded as `company_domain`.                     |
| `name`            | e.g. `NorthStar Renewable Fuels`. Forwarded as `company_name`.         |
| `enrich_realtime` | optional `true|false`. Defaults to `true` when token is present.       |

The proxy validates that at least one of `domain` / `name` is provided
(returns 400 otherwise). For all other failures it returns **HTTP 200**
with a mock body so the UI never breaks.

## Fields requested

We request a curated set covering everything the buyer/seller cards render
plus a 12-point headcount sparkline:

```
company_id, company_name, company_website, company_website_domain,
hq_country, hq_street_address, headquarters,
year_founded,
linkedin_profile_url, linkedin_company_description,
all_office_addresses, markets, acquisition_status,
headcount, taxonomy
```

`headcount` brings nested `linkedin_headcount` and
`linkedin_headcount_timeseries` (we trim the timeseries to the last 12
points). `taxonomy` brings LinkedIn industries, Crunchbase categories, and
the primary NAICS sector — we fold those into a uniform
`{ industries, sectors, tags }` object.

## Response transform

Crustdata returns either:

1. An array of `CompanyData` objects (the common case for known companies).
2. A single object `{ status: "enriching", message, companies_to_be_enriched }`
   when the company is newly seen and is being enriched in the background.
3. A single object `{ status: "not_found" }` for unenrichable inputs.

The proxy normalises all three shapes (plus the legacy `{ results: [...] }`
wrapper) and emits:

```ts
{
  query: { domain?, name? },
  found: boolean,                                   // true only for "found"
  status: "found" | "enriching" | "not_found" | "error" | "mock",
  company: {
    id?, name?, domain?, website?, description?, linkedinUrl?,
    hqCountry?, hqAddress?, yearFounded?, employeeCount?,
    headcountSeries?: { date, count }[],            // last 12 weekly points
    taxonomy?: { industries?, sectors?, tags? },
    markets?: string[],
    offices?: string[],
  },
  source: "live" | "mock",
  fetchedAt: string,                                // ISO timestamp
}
```

Sub-objects are tolerantly parsed — if a field is malformed or missing it's
simply omitted from the output (no thrown errors).

## 200-OK fallback policy

For everything other than "no domain and no name" we **always return HTTP
200** with a `status` and `source` field. This keeps the demo robust:

- Token missing → `status: "mock"`, `source: "mock"`.
- Upstream 4xx/5xx → `status: "error"`, `source: "mock"`.
- Network/timeout (9s `AbortController`) → `status: "error"`, `source: "mock"`.
- Crustdata says enriching → `status: "enriching"`, `source: "live"`,
  `found: false` (UI shows the amber "check back in ~10 min" pill).
- Crustdata returns nothing for the input → `status: "not_found"`,
  `source: "live"`, `found: false`.

The proxy also caches `${domain}|${name}` (lowercased) for 10 minutes
in-memory so repeated lookups don't burn the rate limit.

## Example curls

The dev server is always at `http://localhost:3740`.

### 1. Domain lookup

```
$ curl -s "http://localhost:3740/.netlify/functions/crustdata?domain=hubspot.com" | jq '.status,.source,.company.name,.company.employeeCount'
"found"
"live"
"HubSpot"
11965
```

(Truncated; the live endpoint also returns `headcountSeries` of length 12,
`taxonomy.industries: ["Software Development", ...]`, `offices: [...]`,
`markets: ["NYSE"]`, etc.)

### 2. Name lookup

```
$ curl -s "http://localhost:3740/.netlify/functions/crustdata?name=NorthStar%20Renewable%20Fuels" | jq '.status,.company.name,.company.domain,.company.hqCountry'
"found"
"Northstar Fuel"
"northstarfuel.net"
"USA"
```

(Crustdata fuzzy-matches and may resolve to the closest LinkedIn match.)

### 3. Validation error

```
$ curl -s -w "\nHTTP:%{http_code}" "http://localhost:3740/.netlify/functions/crustdata"
{"error":"Provide ?domain= or ?name= in the query string.","example":"..."}
HTTP:400
```

## Quirks observed in the live API

- Authentication header is **`Authorization: Bearer <token>`**, not
  `Token <token>` (the older Crustdata docs and the previous version of
  this function had it wrong — it returned 401s).
- The endpoint URL works either with or without a trailing slash; we
  use the no-slash form (`/screener/company`) per the OpenAPI spec server.
- `year_founded` is a date-string (`"2006-01-01"`) for some rows and an
  integer for others. We extract the four-digit year defensively.
- The "industries" field on `CompanyData` is **inside** `taxonomy`, not at
  the top level. The previous transform looked for a top-level `industries`
  array and always missed.
- For unknown companies the response is a status object, not an empty
  array, so `Array.isArray(data) && !data[0]` is **not** how to detect
  "not found".
- `enrich_realtime=true` causes Crustdata to enqueue an enrichment job and
  may return `status: "enriching"` immediately — clients should treat this
  as a soft state, not an error.

## Attribution requirement

Wherever Crustdata-sourced data renders, the UI must show:

1. A "VERIFIED VIA CRUSTDATA" pill near the company name, AND
2. Footer text "Source: Crustdata · fulldocs.crustdata.com".

Both are baked into `<CompanyLookupField />`. If you render the data
elsewhere (for example reading from `BuyerProfile.enrichment` directly)
you must include the same attribution.

## Files

- `netlify/functions/crustdata.ts` — proxy function.
- `src/lib/crustdata.ts` — typed client helper (`lookupCompany`, `mockLookup`).
- `src/components/CompanyLookupField.tsx` — input + result card.
- `src/hooks/useBuyerProfile.ts` — localStorage-backed buyer profile that
  stores the enrichment alongside the user's company name.
