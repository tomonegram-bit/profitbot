#!/usr/bin/env bash
set -euo pipefail
# Minimal bootstrap for an Ubuntu server to host this project with Docker Compose.
# Usage: sudo ./scripts/setup-server.sh

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root: sudo $0"
  exit 1
fi

echo "Updating apt and installing prerequisites..."
apt update
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker Engine..."
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  apt update
  apt install -y docker-ce docker-ce-cli containerd.io
fi

if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
  echo "Installing Docker Compose plugin..."
  DOCKER_COMPOSE_BIN=/usr/local/bin/docker-compose
  curl -SL https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-linux-x86_64 -o "$DOCKER_COMPOSE_BIN"
  chmod +x "$DOCKER_COMPOSE_BIN"
fi

echo "Installing nginx and certbot..."
apt install -y nginx certbot python3-certbot-nginx

echo "Creating deploy user 'deploy' (if missing) and adding to docker group..."
if ! id -u deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy || true
fi
usermod -aG docker deploy || true

echo "Cloning repository into /home/deploy/profitbot (if missing)..."
sudo -u deploy bash -lc 'cd /home/deploy && [ -d profitbot ] || git clone https://github.com/tomonegram-bit/profitbot.git profitbot'

echo "Setup complete. Next steps:"
echo " - Configure an nginx site for your domain to reverse proxy to the app ports (3000/3001)."
echo " - Run certbot to issue TLS certs for your domain."
echo " - On changes, run /home/deploy/profitbot/scripts/deploy-to-server.sh as the deploy user."
