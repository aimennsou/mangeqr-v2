# Running MangeQR locally with mock data

This gets you a fully populated local instance: log in as a demo restaurant owner
and browse real menus, reviews, analytics, and the diner-facing QR menu.

## Prerequisites

- Node.js 18+
- A PostgreSQL database. The app's Prisma schema is Postgres-specific
  (`@db.Uuid`, `@db.Text`), so SQLite will not work. Two easy options below.

## 1. Start a Postgres database

**Option A — Docker (recommended, matches the default `.env`):**

```bash
docker run --name mangeqr-db -e POSTGRES_USER=mangeqr -e POSTGRES_PASSWORD=mangeqr -e POSTGRES_DB=mangeqr -p 5432:5432 -d postgres:16
```

**Option B — Neon (free hosted Postgres):**
Create a database at https://neon.tech, copy its connection string, and paste it
into `DATABASE_URL` in `.env` (keep `?sslmode=require`).

## 2. Configure environment

A local `.env` is already provided with safe placeholder values that match the
Docker command above. If you used Neon or different credentials, edit
`DATABASE_URL` in `.env`. Nothing else is required to run with mock data —
email (Resend), S3, and Stripe can stay blank.

> Note: without S3 credentials, uploaded images won't render, but every page
> still works. The seeded demo login is pre-verified, so you don't need Resend.

## 3. Install, create the schema, and seed

```bash
npm install --legacy-peer-deps   # legacy flag works around a react-email peer pin
npx prisma generate
npm run db:push                   # creates all tables from the schema
npm run db:seed                   # inserts the mock data
```

`db:push` is used instead of `migrate` for a quick local setup. To wipe and
reseed at any time: `npm run db:reset`.

## 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000.

## Demo credentials (created by the seed)

| Field    | Value                |
| -------- | -------------------- |
| Email    | `demo@mangeqr.com`   |
| Password | `password123`        |

Sign in at http://localhost:3000/auth/sign-in. After login you'll land on
**Mes performances** with charts, and the sidebar sections (Restaurants, Menus,
Catégories & plats, Avis clients, Campagnes) will all show seeded data.

## The diner-facing menu

The seed prints a direct link to the public menu (also visible on the
Restaurants page QR/share actions). It looks like:

```
http://localhost:3000/restaurant/<restaurant-id>
```

This is the page a diner sees after scanning the QR code — no login required.
Opening it also records a scan, which shows up in the analytics.

## What the mock data includes

- A verified owner (`PRO` plan) with **two restaurants** ("Le Petit Gourmet",
  fully populated, and "Sushi Zen", minimal — so the restaurant selector has
  options).
- Two menus, three categories, seven dishes (with prices, descriptions, allergens).
- Five customer reviews (mix of in-app and Google-routed).
- ~30 days of scan / category-view / dish-view analytics so the charts render.
- One draft marketing campaign with two recipients.

## Troubleshooting

- **`Can't reach database server`** — make sure the Docker container is running
  (`docker ps`) or your Neon URL is correct.
- **`Environment variable not found: DATABASE_URL`** — confirm `.env` exists in
  `mangeqr-v2/` (this folder), not the repo root.
- **Peer dependency errors on install** — use `npm install --legacy-peer-deps`.
- **Reset everything** — `npm run db:reset` (drops all tables and reseeds).

## Diner menu access: path vs subdomain

Each restaurant has a **subdomain** (the "Lien d'accès à votre menu" field, e.g.
`artisto`), which is globally unique. The diner menu can be reached two ways:

- **Path-based** (always works): `<app-url>/restaurant/<restaurant-id>`
- **Subdomain-based** (production): `https://artisto.<root-domain>`

Which one the QR code / share link uses is decided by the `NEXT_PUBLIC_ROOT_DOMAIN`
env var:

- **Local dev** — leave `NEXT_PUBLIC_ROOT_DOMAIN` unset (or `localhost`).
  Subdomain routing is inert (wildcard `*.localhost` DNS doesn't resolve
  reliably), so links use the path-based form and everything works out of the box.
- **Production** — set `NEXT_PUBLIC_ROOT_DOMAIN=mangeqr.com`. New restaurants then
  get `https://<subdomain>.mangeqr.com` as their access link, and the middleware
  rewrites those hosts to the correct menu.

### Testing subdomain routing locally (optional)

Chrome resolves `*.localhost` to 127.0.0.1 automatically. To exercise the real
middleware rewrite locally, temporarily set `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000`
in `.env` (note: the helper treats plain `localhost` as "disabled", so include a
form that your restaurant subdomain can prefix) and visit
`http://<subdomain>.localhost:3000`. This is only for manual testing — keep it
unset for normal local work.

### Production: subdomain routing checklist

To make `artisto.mangeqr.com` resolve to the app in production:

1. **DNS** — add a wildcard record: `*.mangeqr.com  ->  <your app / load balancer>`
   (plus the apex `mangeqr.com` and `www`).
2. **TLS** — provision a **wildcard certificate** for `*.mangeqr.com` (e.g. via
   your host's managed certs or Let's Encrypt DNS-01). Per-host certs won't scale.
3. **Host / platform routing** — make sure wildcard hosts reach this Next.js app:
   - **Vercel**: add `*.mangeqr.com` as a domain to the project (wildcard domains
     are supported on paid plans) — no extra config; the middleware handles the rest.
   - **Self-hosted (nginx/Caddy/etc.)**: route `server_name *.mangeqr.com` to the
     Next.js server; the middleware reads the `Host` header and rewrites internally.
4. **Env** — set `NEXT_PUBLIC_ROOT_DOMAIN=mangeqr.com` and
   `NEXT_PUBLIC_APP_URL=https://mangeqr.com` in the production environment.
5. **Existing rows** — restaurants created before this have a `qrUrl` pointing at
   the path-based URL. That still works; new/edited restaurants get subdomain URLs.
   (The path route `/restaurant/[id]` is kept permanently as a fallback.)

Reserved labels (`www`, `app`, `admin`, `api`, ...) are rejected as subdomains so
they can't shadow system hosts — see `lib/subdomain.ts`.
