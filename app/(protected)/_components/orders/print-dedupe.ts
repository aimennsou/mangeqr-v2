'use client';

/**
 * Guard against printing the same order ticket twice.
 *
 * Auto-print fires from `onNewOrder` in BOTH `OrdersBoard` and `KitchenBoard`.
 * Staff routinely have Commandes and Cuisine open at once, often on two devices,
 * so a single new order used to produce one ticket per open board.
 *
 * Two layers, in order:
 *
 * 1. `localStorage` (this file's `claimLocal`) — shared across tabs of the same
 *    origin. Cheap and synchronous, so it stops the common case without a round
 *    trip. It cannot help across DEVICES, and two tabs polling in the same
 *    millisecond can both win.
 * 2. `Order.ticketPrintedAt` via POST /api/owner-orders/print-claim — a
 *    conditional UPDATE, so exactly one caller anywhere ever wins. This is the
 *    actual guarantee.
 *
 * Layer 1 alone was the previous behaviour and is why this was filed as a gap.
 */

const STORAGE_KEY = 'mangeqr_autoprinted_orders';
const TTL_MS = 6 * 60 * 60 * 1000; // 6 h — longer than any service window.

type Claims = Record<string, number>;

function read(): Claims {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Claims) : {};
  } catch {
    return {};
  }
}

function write(claims: Claims): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(claims));
  } catch {
    /* quota / private mode — fall back to the server claim */
  }
}

/** Release a local claim, so a lost server claim doesn't block a later retry. */
function releaseLocal(orderId: string): void {
  try {
    const claims = read();
    delete claims[orderId];
    write(claims);
  } catch {
    /* best effort */
  }
}

/**
 * Layer 1: fast, synchronous, per-browser claim. Exported for tests and for
 * callers that cannot await; prefer `claimAutoPrint`.
 */
export function claimLocal(orderId: string): boolean {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  const claims = read();

  if (claims[orderId] != null && now - claims[orderId] < TTL_MS) {
    return false;
  }

  // Prune expired entries while we're here.
  for (const [id, at] of Object.entries(claims)) {
    if (now - at >= TTL_MS) delete claims[id];
  }

  claims[orderId] = now;
  write(claims);
  return true;
}

/**
 * Try to claim `orderId` for auto-printing. Resolves true only when THIS caller
 * should print.
 *
 * On a network failure the server claim is treated as LOST (returns false). An
 * unprinted ticket is recoverable — staff reprint from the order card — whereas
 * a duplicate is waste and confusion on a busy pass.
 */
export async function claimAutoPrint(orderId: string): Promise<boolean> {
  // Cheap local check first: if another tab in this browser already printed,
  // don't even ask the server.
  if (!claimLocal(orderId)) return false;

  try {
    const res = await fetch('/api/owner-orders/print-claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    if (!res.ok) {
      releaseLocal(orderId);
      return false;
    }

    const data: { claimed?: boolean } = await res.json();
    if (!data.claimed) {
      // Another device got there first. Drop the local claim so this browser
      // isn't left holding a claim it never used.
      releaseLocal(orderId);
      return false;
    }

    return true;
  } catch {
    releaseLocal(orderId);
    return false;
  }
}
