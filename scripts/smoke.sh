#!/usr/bin/env bash
# ORIN smoke tests — exercises Netlify Functions running at $BASE.
# Requires `netlify dev` (or `netlify functions:serve`) on port 8888.
# Usage: BASE=http://localhost:8888 ./scripts/smoke.sh

set -u
BASE="${BASE:-http://localhost:8888}"
PREFIX="/.netlify/functions"
PASS=0
FAIL=0

run() {
  local name="$1" expect="$2" shift
  shift 2
  local status
  status=$(curl -sS -o /tmp/smoke.body -w "%{http_code}" --max-time 15 "$@") || status="CURL_FAIL"
  if [ "$status" = "$expect" ]; then
    printf "  OK   [%s] %s -> %s\n" "$expect" "$name" "$status"
    PASS=$((PASS+1))
  else
    printf "  FAIL [%s] %s -> %s\n" "$expect" "$name" "$status"
    echo "       body: $(head -c 200 /tmp/smoke.body)"
    FAIL=$((FAIL+1))
  fi
}

echo "== health =="
run "health happy path" 200 "$BASE$PREFIX/health"
run "health CORS preflight" 204 -X OPTIONS "$BASE$PREFIX/health"

echo "== listings =="
run "listings GET" 200 "$BASE$PREFIX/listings"
run "listings seed (idempotent)" 200 -X POST "$BASE$PREFIX/listings/seed"

echo
echo "Results: $PASS pass / $FAIL fail"
exit $FAIL
