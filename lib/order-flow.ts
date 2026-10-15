import type { OrderStatus, OrderType } from '@prisma/client';

/**
 * Single source of truth for the order lifecycle (FEAT-1/D13b).
 *
 * This used to be duplicated in three places that could drift independently:
 *   - `actions/orders.ts`                              (server authorization)
 *   - `app/(protected)/_components/orders/order-status.ts` (owner boards)
 *   - `app/order/[id]/_components/OrderStatusView.tsx`  (diner stepper)
 *
 * Type-only imports from `@prisma/client`, no DB access and no React — safe to
 * import from server actions, API routes and client components alike.
 *
 *   dine-in : RECEIVED → IN_PREPARATION → READY → SERVED → COMPLETED
 *   delivery: RECEIVED → IN_PREPARATION → READY → OUT_FOR_DELIVERY → DELIVERED → COMPLETED
 *
 * COMPLETED and CANCELLED are terminal and reachable from any non-terminal
 * state (staff can close or void an order at any point).
 */

export const DINE_IN_FLOW: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'SERVED',
  'COMPLETED'
];

export const DELIVERY_FLOW: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED'
];

/** Statuses an order can never advance out of. */
export const TERMINAL_STATUSES: OrderStatus[] = ['COMPLETED', 'CANCELLED'];

/**
 * The status a reopened order returns to: the start of the flow.
 *
 * CANCELLED is recoverable, COMPLETED is not. Cancelling is a one-tap action on
 * a busy pass and is easy to hit by mistake, and until now it was permanent —
 * staff had to make the diner order again, which also burned a second order
 * number. COMPLETED stays final because it is the accounting close: reopening a
 * closed, paid order would let takings be edited after the fact.
 */
export const REOPEN_STATUS: OrderStatus = 'RECEIVED';

/** Whether staff may reopen this order (undo a cancellation). */
export function canReopen(status: OrderStatus): boolean {
  return status === 'CANCELLED';
}

export function flowForType(type: OrderType): OrderStatus[] {
  return type === 'DELIVERY' ? DELIVERY_FLOW : DINE_IN_FLOW;
}

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** The next status in the flow after `status`, or null if terminal/unknown. */
export function nextStatus(
  type: OrderType,
  status: OrderStatus
): OrderStatus | null {
  const flow = flowForType(type);
  const idx = flow.indexOf(status);
  if (idx < 0 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

/** True when `status` belongs to the lifecycle of `type` at all. */
export function isStatusValidForType(
  type: OrderType,
  status: OrderStatus
): boolean {
  return status === 'CANCELLED' || flowForType(type).includes(status);
}

/**
 * Whether staff may move an order from `from` to `to`.
 *
 * Enforced server-side so the UI is not the only thing preventing nonsense:
 * previously any status valid for the type was accepted, which allowed
 * RECEIVED → DELIVERED (skipping preparation) and backwards moves such as
 * COMPLETED → RECEIVED.
 *
 * Allowed:
 *   - the single next step in the type's flow (the "advance" button),
 *   - COMPLETED or CANCELLED from any non-terminal state (close / void),
 *   - CANCELLED → RECEIVED, i.e. reopening a cancelled order (see canReopen),
 *   - a no-op (same status), so a double-tap is idempotent rather than an error.
 *
 * Refused: COMPLETED → anything, skips, and backwards moves.
 */
export function isTransitionAllowed(
  type: OrderType,
  from: OrderStatus,
  to: OrderStatus
): boolean {
  if (!isStatusValidForType(type, to)) return false;
  if (from === to) return true;
  // The one way out of a terminal state: undoing a cancellation. Checked before
  // the terminal guard below, and narrow on purpose — only CANCELLED, and only
  // back to the start of the flow.
  if (canReopen(from)) return to === REOPEN_STATUS;
  if (isTerminal(from)) return false;
  if (to === 'COMPLETED' || to === 'CANCELLED') return true;
  return nextStatus(type, from) === to;
}
