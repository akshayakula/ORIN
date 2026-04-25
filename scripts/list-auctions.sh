#!/usr/bin/env bash
# list-auctions.sh
# Print members of orin:auctions:live and the JSON record for each.
# Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from .env.
#
# Usage:  bash scripts/list-auctions.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE not found" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${UPSTASH_REDIS_REST_URL:-}" || -z "${UPSTASH_REDIS_REST_TOKEN:-}" ]]; then
  echo "error: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set in .env" >&2
  exit 1
fi

URL="${UPSTASH_REDIS_REST_URL%/}"
AUTH="Authorization: Bearer ${UPSTASH_REDIS_REST_TOKEN}"

upstash_cmd() {
  curl -sS -X POST "$URL/" -H "$AUTH" -H 'Content-Type: application/json' -d "$1"
}

echo "== orin:auctions:live =="
RES=$(upstash_cmd '["SMEMBERS", "orin:auctions:live"]')
IDS=$(printf '%s' "$RES" | python3 -c 'import sys,json
r=json.load(sys.stdin).get("result") or []
for k in r: print(k)')

if [[ -z "$IDS" ]]; then
  echo "(empty)"
  exit 0
fi

while IFS= read -r id; do
  [[ -z "$id" ]] && continue
  echo
  echo "-- $id --"
  upstash_cmd "[\"GET\", \"orin:auction:$id\"]" \
    | python3 -c 'import sys,json
try:
  v=json.load(sys.stdin).get("result")
  if v is None: print("(missing)")
  else:
    try: print(json.dumps(json.loads(v), indent=2))
    except Exception: print(v)
except Exception as e: print("parse error:", e)'
done <<< "$IDS"
