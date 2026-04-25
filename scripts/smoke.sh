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

echo "== firms =="
run "firms happy path Houston" 200 "$BASE$PREFIX/firms?lat=29.7604&lng=-95.3698&days=3&sensor=VIIRS_NOAA20_NRT"
run "firms happy path Denver 5d" 200 "$BASE$PREFIX/firms?lat=39.7392&lng=-104.9903&days=5&sensor=VIIRS_SNPP_NRT"
run "firms SF 1d empty" 200 "$BASE$PREFIX/firms?lat=37.7749&lng=-122.4194&days=1"
run "firms MODIS Minneapolis" 200 "$BASE$PREFIX/firms?lat=44.9778&lng=-93.2650&days=5&sensor=MODIS_NRT"
run "firms missing params" 400 "$BASE$PREFIX/firms"
run "firms out-of-range lat" 400 "$BASE$PREFIX/firms?lat=99&lng=-200"
run "firms days too high" 400 "$BASE$PREFIX/firms?lat=29.7&lng=-95.3&days=99"
run "firms unknown sensor silently normalized" 200 "$BASE$PREFIX/firms?lat=29.7&lng=-95.3&days=3&sensor=GARBAGE"
run "firms CORS preflight" 204 -X OPTIONS "$BASE$PREFIX/firms"

echo "== listings (not implemented yet) =="
run "listings GET" 200 "$BASE$PREFIX/listings"
run "listings by id" 200 "$BASE$PREFIX/listings?id=RIN-001"

echo "== audit (not implemented yet) =="
run "audit POST" 200 -X POST -H "Content-Type: application/json" \
  --data '{"lat":29.7604,"lng":-95.3698,"rinId":"RIN-001","days":3}' \
  "$BASE$PREFIX/audit"

echo
echo "Results: $PASS pass / $FAIL fail"
exit $FAIL
