#!/usr/bin/env bash
# =============================================================================
# Apply the Prisma schema to this database and (optionally) seed it.
#
# Prisma lives in the Next.js app (the parent folder), not here. This script
# runs the app's Prisma CLI against THIS database, so the DB folder stays the
# single place you operate the database from.
#
# Layout: this `database/` folder lives INSIDE the app (mangeqr-v2/database),
# so the app root is one level up ("..").
#
# Usage (from database/ folder on the VPS):
#   ./scripts/migrate-and-seed.sh              # schema only (db push)
#   ./scripts/migrate-and-seed.sh --seed       # schema + PRODUCTION-safe seed
#
# Requirements: Node.js + the app's deps installed (cd .. && npm ci).
# DATABASE_URL is read from the APP's .env (../.env) — set it to the app role
# connection string first (see database/.env.example).
# =============================================================================
set -euo pipefail

# scripts/ -> database/ -> app root (mangeqr-v2)
cd "$(dirname "$0")/.."
APP_DIR=".."

if [ ! -f "$APP_DIR/package.json" ] || [ ! -d "$APP_DIR/prisma" ]; then
  echo "App not found at $APP_DIR (expected package.json + prisma/)." >&2
  echo "This script expects database/ to live inside the app (mangeqr-v2/database)." >&2
  exit 1
fi

if [ ! -f "$APP_DIR/.env" ]; then
  echo "No $APP_DIR/.env found. Create it with DATABASE_URL pointing at this DB." >&2
  exit 1
fi

echo "==> prisma generate"
( cd "$APP_DIR" && npx prisma generate )

echo "==> prisma db push (sync schema to the database)"
( cd "$APP_DIR" && npx prisma db push )

if [ "${1:-}" = "--seed" ]; then
  echo "==> Seeding (PRODUCTION-safe: only superadmin + demo accounts)"
  echo "    Requires SUPERADMIN_* and DEMO_* set in $APP_DIR/.env."
  ( cd "$APP_DIR" && npm run db:seed:prod )
fi

echo "==> Schema applied."
