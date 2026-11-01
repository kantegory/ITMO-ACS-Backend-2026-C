#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
mkdir -p .run
COLLECTION='/workspace/homeworks/hw3/booking.postman_collection.json'
run_collection() {
  local mode="$1" users="$2" restaurants="$3" bookings="$4"
  ./compose.sh run --rm --no-deps tools /opt/tools/node_modules/.bin/newman run "$COLLECTION" \
    --env-var "users_url=$users/api" \
    --env-var "restaurants_url=$restaurants/api" \
    --env-var "bookings_url=$bookings/api" \
    --reporters cli,json --reporter-json-export "/workspace/.run/$mode.json"
}
MODE="${1:-all}"
case "$MODE" in all|monolith|microservices|nginx) ;; *) printf 'Usage: %s [all|monolith|microservices|nginx]\n' "$0"; exit 2;; esac
if [[ "$MODE" == all || "$MODE" == monolith ]]; then run_collection monolith http://monolith:3000 http://monolith:3000 http://monolith:3000; fi
if [[ "$MODE" == all || "$MODE" == microservices ]]; then run_collection microservices http://users:3001 http://restaurants:3002 http://bookings:3003; fi
if [[ "$MODE" == all || "$MODE" == nginx ]]; then run_collection nginx http://nginx http://nginx http://nginx; fi
