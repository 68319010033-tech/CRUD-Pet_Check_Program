#!/usr/bin/env bash
set -euo pipefail

# Deploy script run on the server by GitHub Actions CD
# Expects: docker, docker compose, and this repo (or at least compose files) at DEPLOY_PATH

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

echo "==> Pulling latest images"
docker compose -f "$COMPOSE_FILE" pull backend frontend

echo "==> Recreating app containers"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans postgres-db backend frontend

echo "==> Current status"
docker compose -f "$COMPOSE_FILE" ps

echo "==> Deploy finished"
