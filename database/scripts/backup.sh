#!/usr/bin/env bash
# =============================================================================
# Manual on-demand backup. Produces a gzipped SQL dump in ./backups.
#
# Usage (from the database/ folder on the VPS):
#   ./scripts/backup.sh
#
# Reads credentials from ./.env. Uses the running `mangeqr-postgres` container.
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
set -a; [ -f .env ] && . ./.env; set +a

DB_USER="${POSTGRES_USER:-mangeqr}"
DB_NAME="${POSTGRES_DB:-mangeqr}"
OUT_DIR="./backups"
mkdir -p "$OUT_DIR"

TS="$(date -u +%Y%m%d-%H%M%S)"
OUT="${OUT_DIR}/${DB_NAME}-manual-${TS}.sql.gz"

echo "Backing up database '${DB_NAME}' -> ${OUT}"
docker exec -t mangeqr-postgres \
  pg_dump --no-owner --clean --if-exists -U "$DB_USER" "$DB_NAME" \
  | gzip -c > "$OUT"

echo "Done: $(du -h "$OUT" | cut -f1)"
