#!/usr/bin/env bash
set -euo pipefail
# Deploy the latest commit from origin/main on a remote server.
# Usage: run this on the remote server, or have CI SSH and execute it.
# Example: ./scripts/deploy-to-server.sh ~/profitbot

REPO_DIR=${1:-~/profitbot}

if [ ! -d "$REPO_DIR" ]; then
  echo "Cloning repository into $REPO_DIR"
  git clone https://github.com/tomonegram-bit/profitbot.git "$REPO_DIR"
fi

cd "$REPO_DIR"
echo "Fetching latest changes..."
git fetch --all --prune
git reset --hard origin/main

echo "Pulling images and starting services..."
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose pull || true
  docker-compose up -d --remove-orphans
else
  docker compose pull || true
  docker compose up -d --remove-orphans
fi

echo "Cleanup unused images..."
docker image prune -f || true

echo "Deployment complete."
