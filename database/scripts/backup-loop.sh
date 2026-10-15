#!/bin/sh
# =============================================================================
# Backup sidecar loop (runs inside the `backup` container).
#
# Once a day at BACKUP_AT (UTC) it runs pg_dump into /backups and prunes dumps
# older than BACKUP_RETENTION_DAYS. Between runs it just sleeps, so it is cheap.
#
# Env (set by docker-compose): PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
#                              BACKUP_AT BACKUP_RETENTION_DAYS
# =============================================================================
set -eu

BACKUP_DIR=/backups
RETENTION="${BACKUP_RETENTION_DAYS:-7}"
RUN_AT="${BACKUP_AT:-03:00}"

mkdir -p "$BACKUP_DIR"
echo "[backup] loop started — daily at ${RUN_AT} UTC, keeping ${RETENTION} days."

run_dump() {
  ts="$(date -u +%Y%m%d-%H%M%S)"
  out="${BACKUP_DIR}/${PGDATABASE}-${ts}.sql.gz"
  echo "[backup] dumping to ${out}"
  # Custom? We use plain SQL gzipped — simplest to inspect/restore anywhere.
  if pg_dump --no-owner --clean --if-exists | gzip -c > "${out}.tmp"; then
    mv "${out}.tmp" "$out"
    echo "[backup] done: $(du -h "$out" | cut -f1)"
  else
    echo "[backup] FAILED" >&2
    rm -f "${out}.tmp"
  fi
  # Prune old dumps.
  find "$BACKUP_DIR" -name "${PGDATABASE}-*.sql.gz" -type f -mtime +"$RETENTION" -print -delete || true
}

# Sleep until the next HH:MM (UTC), then dump; repeat forever.
while true; do
  now="$(date -u +%H:%M)"
  if [ "$now" = "$RUN_AT" ]; then
    run_dump
    # Avoid double-firing within the same minute.
    sleep 61
  fi
  sleep 30
done
