#!/usr/bin/env bash
# Run on server inside repo root (directory with docker-compose.yml).
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose pull 2>/dev/null || true
docker compose build --pull
docker compose up -d
docker compose ps
