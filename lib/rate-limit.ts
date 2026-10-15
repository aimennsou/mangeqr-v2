import { NextResponse } from 'next/server';

/**
 * Minimal in-process rate limiter for the PUBLIC endpoints.
 *
 * Four routes are reachable without a session (see `publicRoutePrefixes` in
 * routes.ts) and had no limit at all:
 *
 *   POST /api/orders        creates an Order row and burns an orderNumber
 *   POST /api/review        writes a Review row
 *   POST /api/track         writes a ScanData/CategoryData/DishData/FavoriteData row
 *   GET  /api/orders/[id]   polled every 8s by the diner status page
 *
 * The three POSTs are the ones that matter: each call inserts a row, so a script
 * could flood a restaurant's kitchen board with fake orders, spam its reviews, or
 * grow the analytics tables without bound. The GET is included because it is a
 * polled read with a nested include.
 *
 * *** LIMITATIONS — read before trusting this ***
 *
 * 1. State is per-process, in memory. On a serverless/multi-instance deployment
 *    (Vercel) each lambda keeps its own counters, so the effective limit is
 *    roughly `limit × instances`, and a cold start resets it. This raises the
 *    cost of abuse; it does not make it impossible. A real limit needs a shared
 *    store (Upstash Redis / @vercel/kv) keyed the same way — the call sites do
 *    not need to change, only this file.
 * 2. The client IP comes from `x-forwarded-for`, which is only trustworthy
 *    behind a proxy that overwrites it (Vercel does). On a bare Node host a
 *    client can spoof it.
 * 3. Diners in one restaurant usually share a single NAT'd wifi IP, so limits
 *    here must stay generous enough for a full dining room. Err on the loose
 *    side: a false 429 on a real order is worse than a tolerated flood.
 */

/** Named CounterWindow, not Window, so it can't be confused with the DOM type. */
interface CounterWindow {
  count: number;
  resetAt: number;
}

/** bucket -> ip -> window */
const buckets = new Map<string, Map<string, CounterWindow>>();

/**
 * Drop expired windows so the maps can't grow without bound.
 *
 * Uses forEach + a collected key list rather than `for…of` over the Map: the
 * project's tsconfig target predates downlevel Map iteration, and deleting
 * during iteration is best avoided anyway.
 */
function prune(windows: Map<string, CounterWindow>, now: number): void {
  const expired: string[] = [];
  windows.forEach((w, ip) => {
    if (w.resetAt <= now) expired.push(ip);
  });
  expired.forEach((ip) => windows.delete(ip));
}

/**
 * Best-effort client IP. `x-forwarded-for` is a comma-separated chain; the first
 * entry is the original client.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets. Used for Retry-After. */
  retryAfter: number;
}

/**
 * Count one hit against `bucket` for this caller.
 *
 * Fixed window rather than sliding: a caller can burst up to `limit` twice
 * across a window boundary. That is acceptable here — the goal is to stop
 * sustained flooding, not to meter precisely.
 */
export function rateLimit(
  req: Request,
  bucket: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const ip = clientIp(req);

  let windows = buckets.get(bucket);
  if (!windows) {
    windows = new Map();
    buckets.set(bucket, windows);
  }

  // Cheap amortized cleanup: only walk the map when it has grown.
  if (windows.size > 512) prune(windows, now);

  const existing = windows.get(ip);
  if (!existing || existing.resetAt <= now) {
    windows.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  return { ok: true, retryAfter: 0 };
}

/**
 * Apply a limit and return a ready-to-send 429 when exceeded, or null to
 * continue. Mirrors the `blockIfTrialExpired` / `blockIfNoPermission` shape in
 * lib/trial-guard.ts so route handlers read consistently.
 */
export function blockIfRateLimited(
  req: Request,
  bucket: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const { ok, retryAfter } = rateLimit(req, bucket, limit, windowMs);
  if (ok) return null;

  return NextResponse.json(
    { error: 'Trop de requêtes. Merci de réessayer dans un instant.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}

const MINUTE = 60_000;

/**
 * Per-route limits, all per-IP per-minute. Tuned for a shared restaurant wifi,
 * not for a single user.
 */
export const PUBLIC_LIMITS = {
  /** Order creation. A full dining room ordering at once must not trip this. */
  createOrder: { bucket: 'orders:create', limit: 20, windowMs: MINUTE },
  /** Diner status page polls every 8s (≈8/min); 60 leaves room for reloads. */
  readOrder: { bucket: 'orders:read', limit: 60, windowMs: MINUTE },
  /** Reviews are a deliberate one-off action per diner. */
  createReview: { bucket: 'review:create', limit: 6, windowMs: MINUTE },
  /** Analytics fire on menu load plus every category/dish tap — legitimately chatty. */
  track: { bucket: 'track', limit: 120, windowMs: MINUTE }
} as const;
