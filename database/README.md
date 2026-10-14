# MangeQR — Self-hosted PostgreSQL on a Debian VPS

This folder runs the MangeQR production database on **your own Debian VPS**,
replacing the hosted Neon database. It uses Docker Compose to run PostgreSQL 16
with a dedicated least-privilege app role, automated nightly backups, and an
optional pgAdmin web UI.

> This folder lives **inside** the Next.js app (`mangeqr-v2/database`). The app
> (the parent folder, `..`) is unchanged — it still reads a single
> `DATABASE_URL`. You just point that at this database instead of Neon.

---

## What's in here

```
database/
├── docker-compose.yml      Postgres 16 + backup sidecar (+ optional pgAdmin)
├── .env.example            Copy to .env and fill in credentials
├── init/                   One-time DB init (run on first boot only)
│   ├── 01-extensions.sql   pgcrypto, citext
│   └── 02-app-role.sh      Creates the least-privilege app role
├── scripts/
│   ├── setup.sh            Bootstrap Docker on a fresh Debian VPS + start
│   ├── create-app-role.sh  Create/rotate the app role after first boot
│   ├── migrate-and-seed.sh Apply Prisma schema (+ optional prod seed)
│   ├── backup.sh           Manual on-demand backup
│   ├── backup-loop.sh      Nightly backup loop (runs in the sidecar)
│   ├── restore.sh          Restore a dump (destructive, confirms first)
│   └── healthcheck.sh      Status + connectivity check
└── backups/                Gzipped SQL dumps land here (gitignored)
```

---

## 1. Provision the VPS (fresh Debian 12)

SSH in as a sudo user and get the project onto the box (git clone or scp). This
`database/` folder lives inside the app (`mangeqr-v2/database`), so having the
app checked out is all `migrate-and-seed.sh` needs — it runs Prisma from the
parent folder.

```bash
cd database
sudo ./scripts/setup.sh
```

`setup.sh` installs Docker Engine + the compose plugin from Docker's official
apt repo, then (on first run) creates `.env` from the template and stops so you
can fill it in.

Edit `.env` and set at least:
- `POSTGRES_PASSWORD` — superuser password (`openssl rand -base64 32`)
- `APP_DB_PASSWORD` — the app role's password (`openssl rand -base64 32`)

Then start it:

```bash
docker compose up -d
./scripts/healthcheck.sh
```

If you set `APP_DB_PASSWORD` **before** the very first `up`, the app role is
created automatically. If you set it later, run:

```bash
./scripts/create-app-role.sh
```

---

## 2. Point the app at this database

In the **app's** env (`../.env`, i.e. `mangeqr-v2/.env`), set `DATABASE_URL` to the app role.
For an app running on the **same VPS** (recommended), connect over localhost:

```
DATABASE_URL="postgresql://mangeqr_app:YOUR_APP_PASSWORD@localhost:5432/mangeqr?schema=public&sslmode=disable"
```

Notes:
- Neon required `?sslmode=require`; over the loopback (`localhost`) you don't
  need TLS, so `sslmode=disable` is correct and avoids cert hassle.
- Use the `mangeqr_app` role here, **not** the superuser.

Apply the schema and (optionally) seed:

```bash
cd database
./scripts/migrate-and-seed.sh          # schema only
./scripts/migrate-and-seed.sh --seed   # schema + production-safe seed
```

`db push` creates all tables from `prisma/schema.prisma`. The `--seed` step runs
`npm run db:seed:prod`, which only touches the SUPERADMIN + Demo accounts (it
never wipes tenant data) and needs `SUPERADMIN_*` / `DEMO_*` set in the app
`.env`.

---

## 3. Remote access (only if the app is NOT on this VPS)

By default Postgres binds to `127.0.0.1` — unreachable from the internet. That
is the safe default. If your app runs on a **different** host, pick ONE:

**Option A — SSH tunnel (simplest, no exposed port).**
From the app host:
```bash
ssh -N -L 5432:localhost:5432 user@your-vps
```
Then the app uses `DATABASE_URL=...@localhost:5432/...` as if local.

**Option B — Private network / VPN** (e.g. WireGuard, or your provider's private
network). Set `POSTGRES_BIND=<private-ip>` in `.env`, restart, and firewall 5432
to the VPN subnet only.

**Option C — Public with TLS + firewall (last resort).**
Only if A/B aren't possible. You must:
1. `POSTGRES_BIND=0.0.0.0` in `.env`.
2. Lock port 5432 to the app's IP with `ufw` (below).
3. Enable TLS in Postgres and use `?sslmode=require` in `DATABASE_URL`.

### Firewall (ufw)
```bash
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw allow OpenSSH
# Only for Option C — restrict to the app's IP:
# sudo ufw allow from <APP_IP> to any port 5432 proto tcp
sudo ufw enable
sudo ufw status verbose
```

### pgAdmin (optional)
```bash
docker compose --profile admin up -d
```
It binds to `127.0.0.1:5050`. Reach it over an SSH tunnel — never expose it:
```bash
ssh -N -L 5050:localhost:5050 user@your-vps   # then open http://localhost:5050
```

---

## 4. Backups

The `backup` sidecar runs automatically: a daily `pg_dump` at `BACKUP_AT` (UTC)
into `./backups`, keeping `BACKUP_RETENTION_DAYS` days. Check it:

```bash
ls -lh backups/
docker logs mangeqr-pg-backup
```

On demand:
```bash
./scripts/backup.sh
```

Restore (DESTRUCTIVE — drops & recreates all objects, asks for confirmation):
```bash
./scripts/restore.sh ./backups/mangeqr-20260101-030000.sql.gz
```

**Off-site copies matter.** The sidecar keeps backups on the same disk as the
DB. Periodically copy them off the VPS, e.g. a cron entry on another machine:
```bash
rsync -az user@your-vps:/path/to/database/backups/ /local/mangeqr-backups/
```
Or push to object storage (S3/Backblaze) with a small cron + `aws s3 cp`.

---

## 5. Day-to-day operations

```bash
docker compose ps                 # status
docker compose logs -f postgres   # live logs
docker compose restart postgres   # restart
docker compose down               # stop (data persists in the named volume)
docker compose up -d              # start
./scripts/healthcheck.sh          # connectivity + size + recent backups
```

Open a psql shell:
```bash
docker exec -it mangeqr-postgres psql -U mangeqr -d mangeqr
```

### Upgrading Postgres major versions
A major bump (16 → 17) is **not** an in-place volume swap. Do it with a dump:
```bash
./scripts/backup.sh                       # dump on the old version
docker compose down
# bump image tag to postgres:17-alpine in docker-compose.yml, then:
docker volume rm mangeqr-pgdata           # ONLY after you have a verified dump
docker compose up -d
./scripts/restore.sh ./backups/<the-dump>.sql.gz
```

---

## 6. Migrating off Neon (one time)

1. Dump the current Neon database from your machine:
   ```bash
   pg_dump --no-owner --clean --if-exists "$NEON_DATABASE_URL" | gzip > neon-export.sql.gz
   ```
2. Copy it to the VPS `database/backups/` folder.
3. Start this stack (steps 1–2 above) and restore:
   ```bash
   ./scripts/restore.sh ./backups/neon-export.sql.gz
   ```
4. Switch the app's `DATABASE_URL` to the VPS and redeploy.

> Match the Postgres major version where you can. Neon runs recent Postgres;
> this stack uses 16. A plain SQL dump restores across minor/most major versions,
> but verify with `./scripts/healthcheck.sh` and a quick app smoke test.

---

## 7. Troubleshooting

- **`POSTGRES_PASSWORD` error on `up`** — you didn't set it in `.env`. Compose
  refuses to start without it (that's the `:?` guard).
- **App can't connect** — check `./scripts/healthcheck.sh`; confirm
  `DATABASE_URL` uses `mangeqr_app` + the right password + `localhost:5432`.
- **Prisma P1001 (can't reach DB)** — the container isn't up/healthy, or the
  host/port in `DATABASE_URL` is wrong (tunnel not open for remote).
- **Permission denied on tables** — the app role isn't the schema owner; re-run
  `./scripts/create-app-role.sh`.
- **Init scripts didn't run** — they only run on an **empty** data volume. If the
  volume already existed, run `create-app-role.sh` manually.
- **Scripts won't execute** — `chmod +x scripts/*.sh` (git may not preserve the
  bit on Windows checkouts).

---

## Security checklist

- [ ] Strong, unique `POSTGRES_PASSWORD` and `APP_DB_PASSWORD`.
- [ ] App connects as `mangeqr_app` (least privilege), not the superuser.
- [ ] Port bound to `127.0.0.1` unless you deliberately chose remote access.
- [ ] `ufw` enabled; 5432 not open to the world.
- [ ] pgAdmin reached via SSH tunnel, never exposed.
- [ ] Backups copied off the VPS regularly.
- [ ] `.env` is gitignored (it is) and never committed.
