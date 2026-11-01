#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec docker compose -p booking-course --env-file "$ROOT/.env" -f "$ROOT/labs/lab3/docker-compose.yml" "$@"
