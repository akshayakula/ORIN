#!/usr/bin/env bash
# clear-auctions.sh
# Wipe all ORIN live auction state directly from Upstash Redis (REST API).
# Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from the project's .env.
#
# Usage:  bash scripts/clear-auctions.sh

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

# Helper: POST a single command (JSON array) and echo the .result line.
upstash_cmd() {
  local body="$1"
  curl -sS -X POST "$URL/" -H "$AUTH" -H 'Content-Type: application/json' -d "$body"
}

echo "Scanning for orin:auction:* keys..."

CURSOR="0"
DELETED=0
KEYS_TO_DELETE=()

while :; do
  RES=$(upstash_cmd "[\"SCAN\", \"$CURSOR\", \"MATCH\", \"orin:auction:*\", \"COUNT\", \"100\"]")
  # Result shape: { "result": ["nextCursor", ["k1","k2", ...]] }
  NEXT=$(printf '%s' "$RES" | python3 -c 'import sys,json; r=json.load(sys.stdin)["result"]; print(r[0])')
  COUNT=$(printf '%s' "$RES" | python3 -c 'import sys,json; r=json.load(sys.stdin)["result"]; print(len(r[1]))')
  if [[ "$COUNT" != "0" ]]; then
    while IFS= read -r k; do
      [[ -n "$k" ]] && KEYS_TO_DELETE+=("$k")
    done < <(printf '%s' "$RES" | python3 -c 'import sys,json
r=json.load(sys.stdin)["result"]
for k in r[1]: print(k)')
  fi
  CURSOR="$NEXT"
  if [[ "$CURSOR" == "0" ]]; then
    break
  fi
done

for k in "${KEYS_TO_DELETE[@]}"; do
  upstash_cmd "[\"DEL\", \"$k\"]" >/dev/null
  DELETED=$((DELETED+1))
done

# Always nuke the live set last.
upstash_cmd "[\"DEL\", \"orin:auctions:live\"]" >/dev/null

echo "Deleted $DELETED auction keys (plus orin:auctions:live)."
