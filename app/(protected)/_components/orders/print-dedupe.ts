'use client';

/**
 * Cross-tab guard against printing the same order ticket twice.
 *
 * Auto-print fires from `onNewOrder` in BOTH `OrdersBoard` and `KitchenBoard`.
 * Staff routinely have Commandes and Cuisine open at once (often on two
 * devices), so a single new order used to produce one ticket per open board —
 * and nothing recorded that a ticket had already come out.
 *
 * `localStorage` is shared across tabs of the same origin, so claiming an order
 * id there de-duplicates between boards and between tabs. Entries older than
 * `TTL_MS` are pruned so the key can't grow without bound.
 *
 * This is best-effort, not a distributed lock: two tabs polling at the exact
 * same millisecond could both claim. The polls run on different intervals
 * (8s vs 6s), so in practice the window is negligible. A real guarantee needs
 * server-side print tracking (an `Order.ticketPrintedAt` column), which is the
 * follow-up if duplicate tickets are ever observed in the field.
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
    /* quota / private mode — fall back to printing */
  }
}

/**
 * Try to claim `orderId` for auto-printing. Returns true when THIS caller won
 * the claim and should print, false when a ticket was already produced for that
 * order by another board or tab.
 */
export function claimAutoPrint(orderId: string): boolean {
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
