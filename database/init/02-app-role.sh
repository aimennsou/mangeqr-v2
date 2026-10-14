#!/bin/sh
# =============================================================================
# Create the least-privilege application role the Next.js app connects as.
#
# Runs ONCE, only on first initialization of an empty data directory (standard
# postgres docker-entrypoint-initdb.d behavior). Idempotent anyway (guards with
# IF NOT EXISTS / DO blocks) so re-running by hand is safe.
#
# Why a separate role: the app should not connect as the Postgres superuser.
# This role owns the `public` schema so Prisma `migrate` / `db push` can create
# and alter tables, but it is not a superuser and cannot touch other databases.
#
# APP_DB_USER / APP_DB_PASSWORD come from the environment (passed by compose).
# If APP_DB_PASSWORD is empty, this script is skipped with a warning so first
# boot doesn't fail — create the role later via scripts/create-app-role.sh.
# =============================================================================
set -eu

if [ -z "${APP_DB_PASSWORD:-}" ]; then
  echo "[init] APP_DB_PASSWORD not set — skipping app-role creation."
  echo "[init] Create it later with: ./scripts/create-app-role.sh"
  exit 0
fi

APP_USER="${APP_DB_USER:-mangeqr_app}"
DB_NAME="${POSTGRES_DB:-mangeqr}"

echo "[init] Creating application role '${APP_USER}' on database '${DB_NAME}'..."

# psql runs as the superuser (POSTGRES_USER) against POSTGRES_DB here.
psql -v ON_ERROR_STOP=1 \
  --username "${POSTGRES_USER}" \
  --dbname "${DB_NAME}" \
  --set app_user="${APP_USER}" \
  --set app_password="${APP_DB_PASSWORD}" \
  --set db_name="${DB_NAME}" <<'EOSQL'
-- Create the role if it does not exist (password set via psql variable).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password');
  ELSE
    EXECUTE format('ALTER ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password');
  END IF;
END
$$;

-- Let the app role connect to and own objects in the database. Making it the
-- owner of the `public` schema is what lets Prisma create/alter tables.
GRANT CONNECT ON DATABASE :"db_name" TO :"app_user";
ALTER SCHEMA public OWNER TO :"app_user";
GRANT ALL ON SCHEMA public TO :"app_user";

-- Default privileges so future objects created by the superuser are usable by
-- the app role too (belt-and-suspenders; normally the app role owns them).
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO :"app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO :"app_user";
EOSQL

echo "[init] Application role '${APP_USER}' ready."
