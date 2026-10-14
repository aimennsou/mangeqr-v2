#!/usr/bin/env bash
# =============================================================================
# Quick health + status check for the database stack.
# Usage (from database/ folder):  ./scripts/healthcheck.sh
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
set -a; [ -f .env ] && . ./.env; set +a

DB_USER="${POSTGRES_USER:-mangeqr}"
DB_NAME="${POSTGRES_DB:-mangeqr}"

echo "== Containers =="
docker compose ps || true

echo
echo "== pg_isready =="
if docker exec mangeqr-postgres pg_isready -U "$DB_USER" -d "$DB_NAME"; then
  echo "Postgres is accepting connections."
else
  echo "Postgres is NOT ready." >&2
  exit 1
fi

echo
echo "== Version & size =="
docker exec -t mangeqr-postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
  "SELECT version();" -c \
  "SELECT pg_size_pretty(pg_database_size('${DB_NAME}')) AS db_size;"

echo
echo "== Recent backups =="
ls -lh ./backups 2>/dev/null | tail -n 5 || echo "(no backups yet)"
