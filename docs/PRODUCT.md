# MangeQR — Product Reference

> Context document for AI assistants and new engineers. Describes **what** the product
> does and **why**. For **how** it is built, see `ARCHITECTURE.md` in the same folder.
> User-facing copy is primarily **French** (the product serves France + Algeria); the
> app also ships **Arabic (RTL)** and **English** via an in-app language switcher.

---

## 1. What MangeQR is

MangeQR is a web app that gives restaurants a **digital, QR-code menu** and the tooling
around it: menu management, QR/printable-menu generation, customer reviews, email
marketing, scan/engagement analytics, diner ordering, and in-store display screens
(TV board + self-order kiosk). One account (an "owner") can run multiple restaurants;
paid plans gate how many restaurants/menus/campaigns are allowed.

Billing supports two worlds:
- **Online (Stripe)** — card subscriptions (EUR), scaffolded; may be disabled.
- **Cash / "espèce" (Algeria)** — the owner pays offline; the back-office sets the
  plan + expiry in the DB. Diners never pay MangeQR; owners do.

---

## 2. Who uses it

| Actor | Who | Where |
|---|---|---|
| **Owner** | Restaurant owner/manager, the paying account | `(protected)` dashboard |
| **Member** | Staff invited into an owner's workspace, scoped by permission + restaurant | same dashboard, limited |
| **Diner** | Customer who scans the QR | public `/restaurant/[id]` or `sub.mangeqr.com` |
| **Lead** | Anonymous visitor from paid ads who builds a trial menu | `/go/*`, `/m/[id]` |
| **Back-office (STAFF / ADMIN)** | Sales/CRM: follow up leads, quotes, cash upgrades | `/superadmin` subset |
| **SUPERADMIN** | Full console: users, plans, suspensions, broadcasts | `/superadmin` |

Roles live on `User.role` (`USER`, `STAFF`, `ADMIN`, `SUPERADMIN`); workspace
relationship lives on `Membership` (`OWNER` / `MEMBER`).

---

## 3. Core features

### 3.1 Digital menus
- Hierarchy: **Restaurant → Menu → MenuCategory → Dish**. Each level has a `position`
  (drag-to-reorder) and an ACTIVE/INACTIVE state.
- Dishes carry name, description, price, photo, allergens, and optional **add-on groups**
  (single/multi-select options with price deltas) for ordering.
- Menus have an **availability** (array of French weekday names). A menu only appears on
  the diner page on its available days (empty = always).
- Managed under `/menu` (menus) and `/categories` (categories + dishes).

### 3.2 QR codes & physical menus
- Every restaurant gets a QR that encodes the **path-based** diner URL
  (`/restaurant/<id>`) — stable and independent of the subdomain.
- Human-friendly **subdomain** link (`name.mangeqr.com`) resolves the same menu
  (see ARCHITECTURE §subdomain). The two are a redundancy pair.
- QR can be exported as **PNG / JPEG / PDF**; printable menu **cards** are generated from
  fixed HTML/CSS templates filled with the restaurant's data (`/cartes`, "Menu physique").
- Owners can also order a professionally produced **QR design** (poster, engraved disc…)
  via `DesignOrder`, followed up by the back-office.

### 3.3 Diner experience (the public menu)
- Phone-first menu rendered inside a device frame on desktop (`DinerMenuScreen` →
  `PublicMenu`). Multilingual with its own FR/AR/EN switcher.
- Diners can browse by category, favorite dishes (heart → feeds a KPI), and — when the
  account + restaurant have ordering enabled — **place an order** (dine-in with a table
  pick, or delivery with contact/address).
- Scans, category views, dish views and favorites are tracked for analytics.

### 3.4 Reviews (reputation management)
- Diners leave a star rating + optional message/contact. The routing rule:
  - **< 3 stars** → kept **in-app** (`ReviewState.MANGEQR`); the diner is asked for
    phone/email + observation so the owner can recover the relationship privately.
  - **4–5 stars** → routed to the restaurant's **Google** business profile.
- Reviews are shareable as an **embeddable badge** (with the MangeQR logo) via an embed
  link generated on the reviews page.
- Managed under `/reviews`; surfaced on `/performances` ("Derniers avis").

### 3.5 Marketing
- Email campaigns (`MarketingCampaign` + `EmailRecipient`) sent via Resend from `/marketing`.
- Campaign + recipient counts are plan-gated.

### 3.6 Analytics / performance
- `/performances` dashboard: scans over time, category/dish engagement, most-viewed and
  most-favorited dish, recent reviews. Backed by `ScanData`, `CategoryData`, `DishData`,
  `FavoriteData` and the `cards1/cards2/*graph` API routes.

### 3.7 Ordering + in-store displays (FEAT-1 / #3)
- **Orders**: diner-placed `Order` (DINE_IN / DELIVERY) with a shared status lifecycle;
  staff manage them on `/commandes` and a kitchen view `/cuisine`. Line items snapshot
  dish name/price/add-ons so history stays accurate when the menu changes.
- **Tables / floor plan**: owner arranges `TableZone` + `RestaurantTable` on a canvas;
  diners pick a table when ordering dine-in.
- **TV menu board** (`/tv/[id]`) and **self-order kiosk / borne** (`/borne/[id]`): public
  in-store screens, each gated by an account-level flag (`tvEnabled`, `kioskEnabled`) and
  configured via `tvConfig` / `borneConfig`.
- Ticket printing for orders (per-restaurant `printerConfig`), de-duplicated server-side.

### 3.8 Teams / workspace
- Owner invites staff by link + code (`Invitation`), optionally **before** the person has
  an account. On redeem a `Membership` is created.
- Members are scoped two ways: **area permissions** (menus, orders, reviews…) and
  **per-restaurant scope** (`restaurantIds`). A per-member **activity journal**
  (`WorkspaceActivity`) lets the owner review what staff did.

### 3.9 Plans & billing
- Plans: `FREE`, `STARTER`, `PRO`, `PREMIUM`. Limits (restaurants, menus, campaigns,
  branding removal) defined in `config/index.ts`, enforced via `lib/plan.ts`
  (`getPlanLimits`, `getEffectivePlan`).
- **Expiry-aware**: once `planRenewsAt` is in the past, a paid plan is treated as STARTER
  for gating (`getEffectivePlan`). Trial expiry can hide the public menu.
- **Cash upgrades** (Algeria, DINAR): a `PlanUpgradeRequest` the back-office follows up on
  — not a Stripe checkout. Account status (plan type + expiration) is shown to the owner
  in `/account`.

### 3.10 Lead-generation funnel
- Paid-ad landing (`/go/fr`, `/go/ar`) → anonymous visitor builds a quick menu
  (`LeadMenu`, stored as JSON, no account) → gets a preview + QR (`/m/[id]`) → optionally
  orders a physical QR design (captures contact). Back-office works these in a leads CRM
  (`LeadActivity`, call/delivery/order sub-statuses) and converts them into real accounts.

### 3.11 Support
- Landing contact form **and** in-app support form both persist a `SupportMessage`
  (threaded with `SupportReply`) and best-effort email the team. Triaged by the back-office
  in a support inbox. Users see their own tickets + replies.

### 3.12 Hardware quotes
- `DevisRequest` captures interest in a kiosk (borne) / TV board, or a plan enquiry, from
  the pricing/kit sections; followed up by the back-office.

### 3.13 Notifications
- In-app bell (`Notification`): support replies, design/printed-order status changes,
  admin broadcasts, and plan-limit-hit nudges.

---

## 4. Key product flows

**New owner onboarding**
Sign up → verify email → `/onboarding` wizard (create restaurant → menu → categories/dishes
→ QR) → `onboardedAt` stamped → `/performances`.

**Diner scan → order**
Scan QR → `/restaurant/[id]` (or `sub.mangeqr.com`) → browse (scan tracked) → favorite /
view (tracked) → if ordering enabled: pick table or enter delivery details → submit
`Order` → live status page under `/order` → staff advance status on `/commandes` / `/cuisine`.

**Review routing**
Diner rates → <3★ stays in-app (contact captured for private recovery) → 4–5★ pushed to
Google profile.

**Cash plan upgrade (Algeria)**
Owner requests upgrade (`PlanUpgradeRequest`, DINAR) → back-office calls + takes payment →
sets plan + `planRenewsAt` → owner sees status/expiry in `/account`; gating respects expiry.

**Lead funnel**
Ad → `/go/*` → build `LeadMenu` → preview `/m/[id]` + order QR design (contact captured) →
back-office CRM follow-up → convert to real `User` + `Restaurant`.

---

## 5. Localization
- Default **French**; **Arabic** (RTL, `<html dir="rtl">`) and **English** available.
- Switcher in the protected app header AND independently on the diner menu.
- Locale persisted via cookie (+ localStorage on the diner device). Dictionaries live in
  `lib/i18n/dictionaries.ts`; missing keys fall back to French. Keep user-facing strings in
  French unless told otherwise.

---

## 6. Deployment notes that affect product behavior
- **Subdomain menus** (`name.mangeqr.com`) require wildcard DNS + `NEXT_PUBLIC_ROOT_DOMAIN`
  set in production; inert locally (falls back to path URLs).
- **Photo uploads** (cover + dish) need S3 configured (presigned-URL flow). Without it,
  images simply don't load; the app degrades gracefully.
- **Email** (auth, support, marketing) needs Resend + a verified `EMAIL_FROM_DOMAIN`.
- **Stripe** is optional; cash/contact path works without it.
