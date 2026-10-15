# MangeQR — Architecture & Technical Reference

> Context document for AI assistants and engineers. Describes **how** the system is built.
> For **what/why** (product, features, flows) see `PRODUCT.md`. The app lives in
> `mangeqr-v2/` — treat that as the project root (the `@/*` path alias resolves there).

---

## 1. Tech stack

- **Framework**: Next.js 14 (App Router, React Server Components), React 18, TypeScript (strict).
- **Styling**: Tailwind CSS + `tailwindcss-animate`; class merge via `cn()` in `lib/utils.ts`
  (clsx + tailwind-merge). UI = shadcn/ui (New York, Radix primitives) in `components/ui`.
  Icons: `lucide-react`, `react-icons`. Animation: `framer-motion`.
- **DB**: PostgreSQL (Neon) via **Prisma** (`@prisma/client`). Singleton client in `lib/db.ts`.
  Schema in `prisma/schema.prisma`. All IDs are UUID strings; `createdAt`/`updatedAt` timestamps.
- **Auth**: NextAuth v5 / Auth.js (`auth.ts`, `auth.config.ts`) with the Prisma adapter,
  credentials + 2FA. Passwords hashed with `bcryptjs`. Route protection in `middleware.ts`;
  route lists in `routes.ts`.
- **Integrations**: Resend + React Email (`components/emails`); Stripe (optional); AWS S3
  (`lib/s3.ts` / `lib/s3-server.ts`); `qrcode` + `pdf-lib` for QR/PDF; `recharts` for charts;
  `@dnd-kit/*` for drag-and-drop; `zustand` for client state; `react-hook-form` + `zod` forms.
- **Build gates**: `npx tsc --noEmit` must stay clean. `next lint` is clean (ESLint gate is
  currently non-blocking via `eslint.ignoreDuringBuilds` in `next.config.js` — intentional).

---

## 2. Directory layout (project root = `mangeqr-v2/`)

```
app/            Next.js App Router — routes, layouts, pages, API
  (landing)/    public marketing site
  (onboarding)/ first-login wizard
  (protected)/  authenticated dashboard (owner + member + superadmin console)
  auth/         sign-in/up, reset, verify
  restaurant/   PUBLIC diner menu ([id] + by-subdomain/[sub] + _shared)
  tv/ borne/    public in-store display screens
  go/ m/ lp/    lead funnel + anonymous lead-menu preview
  order/        diner live order status
  api/<res>/route.ts   REST-style endpoints
actions/        Server Actions ('use server') for mutations
data/           Prisma read helpers (queries by entity)
lib/            core utils + integrations (db, auth, mail, email, s3, plan, i18n, …)
helpers/ config/ schemas/ types/   pure helpers, app config, zod schemas, shared types
components/     shared React components (ui/, emails/, auth/, billing/, settings/, …)
hooks/          custom hooks + zustand stores
prisma/         schema.prisma + seed.ts
docs/           this file + PRODUCT.md
scripts/        tooling (.mjs): i18n parity, orphan modules, stripe setup
```

Folders prefixed `_` (e.g. `_components`, `_admin-panel`, `_shared`) are **private**
(not routable). Route groups `(landing)`, `(protected)`, `(onboarding)` don't add URL segments.

---

## 3. Data model (Prisma)

Cascade spine: **User → Restaurant → Menu → MenuCategory → Dish** (all `onDelete: Cascade`).

**Identity / auth**: `User` (role, plan, planPaymentMethod, planRenewsAt, suspended,
onboardedAt, orderingEnabled/kioskEnabled/tvEnabled, adminPermissions JSON), `Account`,
`VerificationToken`, `PasswordResetToken`, `TwoFactorToken`, `TwoFactorConfirmation`.

**Workspace / teams**: `Membership` (OWNER/MEMBER, `permissions` JSON, `restaurantIds` JSON
scope), `Invitation` (invite-before-account), `WorkspaceActivity` (per-member journal).

**Menu domain**: `Restaurant` (subdomain @unique, qrUrl, currency, social links + states,
`menuAppearance`/`printerConfig`/`tvConfig`/`borneConfig` JSON, orderingEnabled), `Menu`
(`availability String[]`, state), `MenuCategory`, `Dish` (allergenes String[], price Float),
`DishAddonGroup` + `DishAddonOption` (ordering add-ons).

**Diner / ordering**: `Order` (type DINE_IN/DELIVERY, status lifecycle, denormalized `total`,
`paid`/`paidAt`, `ticketPrintedAt` server print-claim, per-restaurant `orderNumber`),
`OrderItem` (snapshots dishName/unitPrice/addons so history is stable; `dishId` SetNull),
`RestaurantTable` + `TableZone` (floor plan).

**Engagement / analytics**: `ScanData`, `CategoryData`, `DishData`, `FavoriteData`
(all indexed on `[restaurantId, createdAt]`; Dish-referencing ones Cascade so KPIs never
resolve to orphan rows). `Review` (ReviewState GOOGLE/MANGEQR), `MarketingCampaign` +
`EmailRecipient`, `Newsletter`.

**Growth / back-office**: `LeadMenu` (anonymous, menu as JSON, CRM sub-statuses) +
`LeadActivity`; `DesignOrder` (physical QR orders); `DevisRequest` (hardware/plan quotes);
`PlanUpgradeRequest` (cash upgrades); `SupportMessage` + `SupportReply`; `Notification`.

Enums worth knowing: `UserRole`, `Plan`, `PlanPaymentMethod`, `WorkspaceRole`, `OrderType`,
`OrderStatus`, `ReviewState`, `Currency` (EURO/DOLLAR/DINAR), plus Lead/Devis/Support/Design
status enums.

---

## 4. Auth & route protection

- `auth.config.ts` is **edge-safe** (providers only) and used by `middleware.ts`; the full
  session (jwt/session callbacks that populate role) lives in `auth.ts`.
- `middleware.ts` responsibilities, in order:
  1. **Subdomain routing** — if Host is `<sub>.<rootDomain>`, rewrite internally to
     `/restaurant/by-subdomain/<sub>` and skip auth (diner-facing).
  2. **Auth flow** — `isPublicPath()` (from `routes.ts`, segment-boundary matching) decides
     public vs protected; signed-out users on protected paths bounce to `/auth/sign-in`.
     Auth routes redirect signed-in users to `DEFAULT_SIGNIN_REDIRECT` (`/performances`)
     unless carrying a one-time token.
- **`/superadmin` is gated server-side** (page/layout/actions via `currentRole()`), NOT in
  middleware — the edge config can't reliably read `role`. Don't add a role check in
  middleware.
- Helpers: `lib/authentication.ts` (`currentUser`, `currentUserId`, `currentRole`),
  `lib/backoffice.ts` (`requireBackoffice`), `lib/permissions.ts` / `lib/admin-permissions.ts`.

---

## 5. Conventions (follow these when editing)

- **Mutations → Server Actions** in `actions/` (`'use server'`): validate input with a zod
  schema (`schemas/index.ts`), return `{ error }` / `{ success }` shaped objects.
- **Reads that hit Prisma → `data/`** helpers (e.g. `getUserByEmail` in `data/user.ts`).
  Never import `data/*` into a client component (they're server-only).
- **HTTP endpoints → `app/api/<resource>/route.ts`**. Every handler re-checks auth with
  `currentUserId()` and scopes to the workspace owner — never trust a client-supplied id.
- **Always use the shared Prisma client** `lib/db.ts`; never `new PrismaClient()` elsewhere.
- **Import via `@/` alias**, not long relative paths.
- **File naming is mixed** (kebab + Pascal both appear) — match the folder you're editing.
- Keep **user-facing strings French** and route them through i18n where the surface is
  localized.

---

## 6. Multi-tenancy & scoping

- Data belongs to a workspace **owner**. A member acts on the owner's data, so reads resolve
  the owner first (`getWorkspaceOwnerId`, `getRestaurantScope` in `data/workspace.ts`) and
  then apply the member's `restaurantIds` scope (`lib/restaurant-scope.ts` →
  `scopedRestaurantWhere` / `restaurantFkFilter`).
- Mutations stay **owner-only** or permission-gated; cross-tenant access is prevented by
  scoping every query by `userId`/owner id (e.g. `api/magasin` DELETE/PUT are userId-scoped).

---

## 7. Integrations

### 7.1 S3 (photo uploads) — `lib/s3.ts` (client-safe) + `lib/s3-server.ts` (secrets)
- Browser uploads via a **presigned PUT URL**: client POSTs `/api/upload/presign`
  (auth-gated, validates content type, server-generates the key) → gets `{ url, file_key }`
  → PUTs the file straight to S3. **Credentials never reach the browser.**
- `getS3Url(key)` builds the public URL from `NEXT_PUBLIC_S3_BUCKET_NAME` +
  `NEXT_PUBLIC_S3_REGION` (default `eu-central-1`). Server creds: `S3_ACCESS_KEY_ID` /
  `S3_SECRET_ACCESS_KEY` (with legacy `NEXT_PUBLIC_S3_*` fallback). Display paths resolve via
  `resolvePhoto` (S3 key → URL; absolute/`/`-paths passed through for demo seeds).
- Prod bucket needs public-read + a CORS rule allowing PUT/GET from the app origin.

### 7.2 Email — `lib/email.ts` (core) + `lib/mail.ts` (auth templates)
- Single Resend client. **All** sends go through `sendMail()` which inspects Resend's `error`
  field and returns a boolean (Resend reports failures in the body, not by throwing).
- From-addresses are built on `EMAIL_FROM_DOMAIN` (must be verified in Resend) via named
  `SENDERS`. Support/contact mail goes to `SUPPORT_INBOX_EMAIL` with the sender as reply-to.
- Templates in `components/emails/` use `@react-email/components`. Degrades gracefully when
  `RESEND_API_KEY` is unset.

### 7.3 Subdomain menus — `lib/subdomain.ts`
- `name.mangeqr.com` → middleware rewrite → `/restaurant/by-subdomain/[sub]`. The QR encodes
  the **path** URL (`buildPathMenuUrl`), the shareable link uses `buildSubdomainMenuUrl` —
  independent on purpose (redundancy). `subdomainRoutingEnabled()` is false locally.
  Needs wildcard DNS + `NEXT_PUBLIC_ROOT_DOMAIN` in prod. Subdomains normalized/validated;
  reserved labels blocked; `Restaurant.subdomain` is globally unique.

### 7.4 Stripe (optional) — `lib/stripe.ts`, `actions/stripe`, `app/api/stripe/webhook`
- Online subscriptions (EUR). The app runs fully without it (cash/contact path). Webhook is
  public + signature-verified.

### 7.5 Plans — `config/index.ts` + `lib/plan.ts`
- Tiers/pricing in config. `getPlanLimits(plan)` → caps; `getEffectivePlan(user)` is
  expiry-aware (past `planRenewsAt` ⇒ STARTER). Limits enforced in the menu/magasin/campaign
  API routes; trial expiry can hide the public menu (`isTrialExpired`).

---

## 8. Public diner menu data path (hot path)

`app/restaurant/_shared/menu-data.ts` → `getPublicMenuData({ id | subdomain })`:
- One nested Prisma query (restaurant → active menus → active categories → active dishes →
  addon groups/options) + one grouped `favoriteData.groupBy` aggregate. **No N+1.**
- Filters menus to those available **today** (`availability` vs French weekday).
- Returns a flat view consumed by `DinerMenuScreen` → `PublicMenu` (both path-based and
  subdomain routes share it). `PublicMenu` uses refs + IntersectionObserver + `useCallback`;
  tracking (scan/view/favorite) is fire-and-forget.

---

## 9. Key logic to respect when changing things

- **Order totals/line totals are computed server-side** from menu prices — never trust the
  client. `OrderItem` snapshots dishName/unitPrice/addons; `dishId` is SetNull so removing a
  dish doesn't delete financial history.
- **Ticket auto-print** is de-duplicated server-side via an atomic
  `updateMany({ where: { ticketPrintedAt: null } })` claim — not just localStorage.
- **Review routing** (<3★ in-app vs 4–5★ Google) and **menu availability-by-day** are product
  rules enforced in the diner/review paths.
- **Analytics rows Cascade with their Dish** so KPIs never resolve to orphaned names.
- **Expiry-aware gating** everywhere plan limits are checked.

---

## 10. Commands

Run from `mangeqr-v2/`:
```
npm install            # deps (use --legacy-peer-deps on this repo: react 18.2 vs 18.3 peer)
npx prisma generate    # Prisma client (also runs on build)
npx prisma db push     # sync schema (interactive; pipe "y" or --accept-data-loss)
npm run dev            # dev server (run manually; don't block automation on it)
npm run build          # prisma generate + next build
npm run lint           # next lint
npx tsc --noEmit       # type-check gate (keep clean)
```
Env: copy `.env.example` → `.env`. Keys of note: `DATABASE_URL`, `AUTH_SECRET`/`AUTH_URL`,
`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`, S3 (`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`,
`NEXT_PUBLIC_S3_BUCKET_NAME`/`NEXT_PUBLIC_S3_REGION`), email (`RESEND_API_KEY`,
`EMAIL_FROM_DOMAIN`, `SUPPORT_INBOX_EMAIL`), Stripe (optional), seed accounts.

---

## 11. Inventory snapshot (for orientation)

- **~430 TS/TSX files.** API routes under `app/api/`: admin, areagraph, bargraph, piegraph,
  cards1, cards2, campaign(+send), categorie(+duplicate/position), menu(+duplicate/position),
  plat(+addons/duplicate/position), magasin(+menu-preview), review, order-metrics, orders(+[id]),
  owner-orders(+print-claim), tables, settings, notifications, design-orders, download-pdf,
  download-jpeg, embed, track, team/context, upload/presign, stripe/webhook,
  superadmin/{users,restaurants,design-orders}, auth/[...nextauth].
- **Actions** (`actions/`): auth (sign-in/up/out, reset, verify, update-password/profile/email),
  onboarding, orders, tables, addons, design-order, devis, lead, plan-upgrade, notifications,
  support, update-{display-config,menu-appearance,printer-config}, team/, superadmin/, stripe/.
- **Data** (`data/`): user, account, restaurant, orders, addons, tables, workspace, superadmin,
  support, design-order, tokens (verification / password-reset / two-factor).
- **Lib** (`lib/`): db, authentication, backoffice, permissions, admin-permissions, plan,
  trial-guard, restaurant-scope, subdomain, email, mail, s3(+server), pdfUtils, pngUtils,
  download, currency, menu-appearance, menu-list, dish-tags, order-flow, notifications,
  rate-limit, team-invite, team-errors, tokens, stripe, utils.
