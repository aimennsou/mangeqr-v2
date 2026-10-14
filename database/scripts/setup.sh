#!/usr/bin/env bash
# =============================================================================
# One-shot bootstrap for a FRESH Debian VPS: installs Docker Engine + the
# compose plugin (official Docker apt repo), then starts the database stack.
#
# Run as root (or with sudo) from the database/ folder:
#   sudo ./scripts/setup.sh
#
# Idempotent: safe to re-run. It will NOT overwrite an existing .env.
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root (sudo ./scripts/setup.sh)." >&2
  exit 1
fi

echo "==> Checking Docker..."
if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker Engine + compose plugin (Debian)..."
  apt-get update
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  . /etc/os-release
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/debian ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  echo "==> Docker already installed: $(docker --version)"
fi

echo "==> Checking .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "    Created .env from template."
  echo "    EDIT .env NOW and set POSTGRES_PASSWORD + APP_DB_PASSWORD, then re-run:"
  echo "      docker compose up -d"
  exit 0
fi

echo "==> Starting the database stack..."
docker compose up -d

echo
echo "==> Done. Postgres is starting. Check status with:"
echo "      docker compose ps"
echo "      ./scripts/healthcheck.sh"
echo
echo "Next: point the app's DATABASE_URL at this database and run:"
echo "      ./scripts/migrate-and-seed.sh"
