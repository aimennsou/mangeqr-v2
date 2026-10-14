#!/usr/bin/env bash
# =============================================================================
# Create (or update) the least-privilege application role AFTER first boot.
#
# Use this when the DB was first started without APP_DB_PASSWORD set (so the
# init-time 02-app-role.sh was skipped), or to rotate the app password.
#
# Usage (from database/ folder):
#   ./scripts/create-app-role.sh
#
# Reads APP_DB_USER / APP_DB_PASSWORD / POSTGRES_* from ./.env.
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
set -a; [ -f .env ] && . ./.env; set +a

: "${APP_DB_PASSWORD:?Set APP_DB_PASSWORD in .env first}"
APP_USER="${APP_DB_USER:-mangeqr_app}"
DB_USER="${POSTGRES_USER:-mangeqr}"
DB_NAME="${POSTGRES_DB:-mangeqr}"

echo "Creating/updating role '${APP_USER}' on '${DB_NAME}'..."

docker exec -i \
  -e APP_USER="$APP_USER" \
  -e APP_PASSWORD="$APP_DB_PASSWORD" \
  -e DB_NAME="$DB_NAME" \
  mangeqr-postgres \
  psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" \
    --set app_user="$APP_USER" \
    --set app_password="$APP_DB_PASSWORD" \
    --set db_name="$DB_NAME" <<'EOSQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password');
  ELSE
    EXECUTE format('ALTER ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password');
  END IF;
END
$$;
GRANT CONNECT ON DATABASE :"db_name" TO :"app_user";
ALTER SCHEMA public OWNER TO :"app_user";
GRANT ALL ON SCHEMA public TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO :"app_user";
EOSQL

echo "Role '${APP_USER}' ready."
