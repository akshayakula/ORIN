// Tiny Upstash Redis REST helper. Native fetch only — no SDK install.
// Never logs the token.

export interface UpstashResult<T = unknown> {
  result: T;
  error?: string;
}

const TIMEOUT_MS = 7000;

let dotenvCache: { url?: string; token?: string } | null = null;

function readDotenv(): { url?: string; token?: string } {
  if (dotenvCache) return dotenvCache;
  dotenvCache = {};
  try {
    // Lazy require so this never breaks in environments without fs (it always
    // exists in Netlify Node functions, but we stay defensive).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const candidates = [
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), "../.env"),
      path.resolve(process.cwd(), "../../.env"),
    ];
    for (const p of candidates) {
      if (!fs.existsSync(p)) continue;
      const text = fs.readFileSync(p, "utf8");
      for (const line of text.split(/\r?\n/)) {
        const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (!m) continue;
        const k = m[1];
        let v = m[2];
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        if (k === "UPSTASH_REDIS_REST_URL" && !dotenvCache.url) dotenvCache.url = v;
        if (k === "UPSTASH_REDIS_REST_TOKEN" && !dotenvCache.token) dotenvCache.token = v;
      }
      if (dotenvCache.url || dotenvCache.token) break;
    }
  } catch {
    /* ignore */
  }
  return dotenvCache;
}

function getCreds(): { url: string; token: string } | null {
  // Prefer values from project's .env file (if present) — Netlify dev can
  // pull stale linked-site env that points to a dead Upstash host.
  const dotenv = readDotenv();
  const url = dotenv.url || process.env.UPSTASH_REDIS_REST_URL;
  const token = dotenv.token || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  let normalized = url.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = "https://" + normalized;
  }
  return { url: normalized, token };
}

export function isConfigured(): boolean {
  return getCreds() !== null;
}

async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  external?: AbortSignal,
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  if (external) {
    if (external.aborted) ctrl.abort();
    else external.addEventListener("abort", onAbort, { once: true });
  }
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(timer);
    if (external) external.removeEventListener("abort", onAbort);
  }
}

export async function redis<T = unknown>(
  cmd: (string | number)[],
  signal?: AbortSignal,
): Promise<T> {
  const creds = getCreds();
  if (!creds) throw new Error("upstash not configured");

  return withTimeout(async (sig) => {
    const res = await fetch(creds.url + "/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmd),
      signal: sig,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`upstash ${res.status}: ${text.slice(0, 160)}`);
    }
    const json = (await res.json()) as UpstashResult<T>;
    if (json && typeof json === "object" && json.error) {
      throw new Error(`upstash error: ${json.error}`);
    }
    return json.result as T;
  }, signal);
}

export async function pipeline(
  cmds: (string | number)[][],
  signal?: AbortSignal,
): Promise<unknown[]> {
  const creds = getCreds();
  if (!creds) throw new Error("upstash not configured");
  if (cmds.length === 0) return [];

  return withTimeout(async (sig) => {
    const res = await fetch(creds.url + "/pipeline", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmds),
      signal: sig,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`upstash ${res.status}: ${text.slice(0, 160)}`);
    }
    const arr = (await res.json()) as Array<UpstashResult<unknown>>;
    if (!Array.isArray(arr)) {
      throw new Error("upstash pipeline: unexpected response shape");
    }
    return arr.map((r) => {
      if (r && typeof r === "object" && "error" in r && r.error) {
        throw new Error(`upstash error: ${r.error}`);
      }
      return r?.result;
    });
  }, signal);
}
