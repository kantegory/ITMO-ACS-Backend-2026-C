#!/usr/bin/env bash
# Build and start Restorator microservices on the server.
# Run from project root on the server: bash deploy/deploy.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_DIR="${PROJECT_ROOT}/restorator-microservices"

cd "${COMPOSE_DIR}"

echo "==> Building and starting containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "==> Waiting for API Gateway..."
for _ in $(seq 1 30); do
  if curl -sf http://127.0.0.1:4000/health >/dev/null; then
    echo "API Gateway is healthy."
    docker compose ps
    exit 0
  fi
  sleep 5
done

echo "ERROR: API Gateway did not become healthy in time."
docker compose logs --tail=50 api-gateway
exit 1
