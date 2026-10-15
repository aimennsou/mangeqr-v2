#!/usr/bin/env bash
# =============================================================================
# Restore a gzipped SQL dump into the database. DESTRUCTIVE: the dumps are
# created with --clean --if-exists, so restoring DROPS and recreates every
# object. Make sure you are restoring into the right database.
#
# Usage (from the database/ folder on the VPS):
#   ./scripts/restore.sh ./backups/mangeqr-20260101-030000.sql.gz
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-backup.sql.gz>" >&2
  exit 1
fi

DUMP="$1"
if [ ! -f "$DUMP" ]; then
  echo "Backup file not found: $DUMP" >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; [ -f .env ] && . ./.env; set +a

DB_USER="${POSTGRES_USER:-mangeqr}"
DB_NAME="${POSTGRES_DB:-mangeqr}"

echo "!! This will OVERWRITE all data in database '${DB_NAME}'."
read -r -p "Type the database name to confirm: " CONFIRM
if [ "$CONFIRM" != "$DB_NAME" ]; then
  echo "Aborted."
  exit 1
fi

echo "Restoring ${DUMP} -> '${DB_NAME}'..."
gunzip -c "$DUMP" | docker exec -i mangeqr-postgres \
  psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME"

echo "Restore complete."
