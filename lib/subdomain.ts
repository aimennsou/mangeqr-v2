/**
 * Subdomain helpers for the diner-facing menu.
 *
 * A restaurant's `subdomain` (e.g. "artisto") is the label used to access its
 * public menu at `artisto.<rootDomain>` in production. Locally, wildcard
 * subdomains of `localhost` don't resolve, so we fall back to the path-based
 * route (`/restaurant/[id]`) and just display the suffix in the UI.
 *
 * Configuration (env):
 * - NEXT_PUBLIC_ROOT_DOMAIN  the apex domain hosting menus, e.g. "mangeqr.com".
 *                            When unset (local dev) subdomain routing is inert.
 * - NEXT_PUBLIC_APP_URL      the app's base URL (used for path-based links/QR).
 */

/** Reserved labels that are NOT restaurant subdomains (app/system hosts). */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "mail",
  "dashboard",
  "staging",
  "preview",
]);

/** The apex domain that hosts diner menus, e.g. "mangeqr.com". */
export function getRootDomain(): string {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "mangeqr.com").toLowerCase();
}

/** The app's base URL (path-based), e.g. "https://mangeqr.com" or localhost. */
export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

/** True when subdomain-based routing is usable (a real root domain is set,
 * i.e. not localhost). */
export function subdomainRoutingEnabled(): boolean {
  const root = getRootDomain();
  return !!root && !root.includes("localhost") && !root.includes("127.0.0.1");
}

/**
 * Normalize a user-entered subdomain: lowercase, spaces/underscores -> hyphen,
 * strip anything that isn't a-z 0-9 or hyphen, collapse repeats, trim hyphens.
 * Returns "" when nothing valid remains.
 */
export function normalizeSubdomain(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Validate a normalized subdomain. Returns an error message (French) or null
 * when valid.
 */
export function validateSubdomain(sub: string): string | null {
  if (!sub) return "Le lien d'accès est requis.";
  if (sub.length < 3) return "Le lien d'accès doit contenir au moins 3 caractères.";
  if (sub.length > 63) return "Le lien d'accès est trop long.";
  if (RESERVED_SUBDOMAINS.has(sub)) return "Ce lien d'accès est réservé.";
  return null;
}

/**
 * Extract a restaurant subdomain from a request Host header, or null when the
 * host is the apex/app domain, a reserved label, or subdomain routing is off.
 * e.g. host "artisto.mangeqr.com", root "mangeqr.com" -> "artisto".
 */
export function extractSubdomainFromHost(host: string | null): string | null {
  if (!host || !subdomainRoutingEnabled()) return null;

  // Strip port and normalize.
  const hostname = host.split(":")[0].toLowerCase();
  const root = getRootDomain();

  if (hostname === root || hostname === `www.${root}`) return null;
  if (!hostname.endsWith(`.${root}`)) return null;

  const label = hostname.slice(0, -(root.length + 1)); // remove ".<root>"
  // Only single-level labels are restaurant subdomains.
  if (!label || label.includes(".")) return null;
  if (RESERVED_SUBDOMAINS.has(label)) return null;

  return label;
}

/**
 * The stable, id-based path URL for a restaurant's menu, e.g.
 * https://mangeqr.com/restaurant/<id>. This is what the QR code encodes — it is
 * intentionally INDEPENDENT of the subdomain so the two access paths act as a
 * redundancy pair: if subdomain/DNS routing ever fails, the QR still resolves.
 */
export function buildPathMenuUrl(id: string): string {
  return `${getAppUrl()}/restaurant/${id}`;
}

/**
 * The human-friendly subdomain URL for a restaurant's menu, e.g.
 * https://artisto.mangeqr.com — used for the shareable link. Falls back to the
 * path URL when subdomain routing is disabled (local dev) or no subdomain is set.
 */
export function buildSubdomainMenuUrl(opts: {
  id: string;
  subdomain?: string | null;
}): string {
  const { id, subdomain } = opts;
  if (subdomainRoutingEnabled() && subdomain) {
    const proto = getAppUrl().startsWith("http://") ? "http" : "https";
    return `${proto}://${subdomain}.${getRootDomain()}`;
  }
  return buildPathMenuUrl(id);
}
