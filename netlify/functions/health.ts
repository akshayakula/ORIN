// Netlify Function: health check.

type Handler = (event: {
  httpMethod?: string;
}) => Promise<{
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}>;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  const body = {
    ok: true,
    service: "orin",
    time: new Date().toISOString(),
    version: "0.1.0",
    env: {
      demo: process.env.VITE_DEMO_MODE === "true",
    },
  };
  return {
    statusCode: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
};

export default handler;
