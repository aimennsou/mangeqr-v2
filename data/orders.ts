import type { OrderStatus, OrderType } from '@prisma/client';

import { db } from '@/lib/db';
import { restaurantFkFilter } from '@/lib/restaurant-scope';

/**
 * Owner/staff order data layer (server-only reads) — FEAT-1.
 *
 * Orders belong to a restaurant, which belongs to a workspace OWNER. Owner AND
 * members both operate on orders (D6), so reads are scoped to the workspace
 * owner's restaurants (resolve via getWorkspaceOwnerId in the caller). These
 * are plain server reads; never import into a client component.
 */

export interface OrderItemView {
  id: string;
  dishName: string;
  quantity: number;
  lineTotal: number;
  addons: { groupName: string; optionName: string; priceDelta: number }[];
  specialRequest: string | null;
}

export interface OrderView {
  id: string;
  orderNumber: number;
  restaurantId: string;
  restaurantName: string | null;
  restaurantAddress: string | null;
  restaurantPhone: string | null;
  type: OrderType;
  status: OrderStatus;
  tableLabel: string | null;
  customerName: string | null;
  customerPhone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  total: number;
  currency: string;
  paid: boolean;
  paidAt: Date | null;
  createdAt: Date;
  items: OrderItemView[];
}

// Statuses considered "active" (still in the kitchen/floor pipeline). Terminal
// states (COMPLETED, CANCELLED) are excluded from the live board by default.
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'SERVED',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
];

import { currencySymbol } from '@/lib/currency';

function mapOrder(o: any): OrderView {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    restaurantId: o.restaurantId,
    restaurantName: o.restaurant?.name ?? null,
    restaurantAddress: o.restaurant?.address ?? null,
    restaurantPhone: o.restaurant?.phone ?? null,
    type: o.type,
    status: o.status,
    tableLabel: o.tableLabel,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    address: o.address,
    latitude: o.latitude,
    longitude: o.longitude,
    note: o.note,
    total: o.total,
    currency: currencySymbol(o.restaurant?.currency),
    paid: o.paid,
    paidAt: o.paidAt,
    createdAt: o.createdAt,
    items: (o.items ?? []).map((it: any) => ({
      id: it.id,
      dishName: it.dishName,
      quantity: it.quantity,
      lineTotal: it.lineTotal,
      addons: Array.isArray(it.addons) ? it.addons : [],
      specialRequest: it.specialRequest
    }))
  };
}

interface ListOrdersArgs {
  ownerId: string;
  restaurantId?: string;
  /**
   * The caller's per-restaurant scope, applied only when `restaurantId` is not
   * set (i.e. the "all restaurants" case). `null`/omitted = unscoped.
   * See lib/restaurant-scope.ts.
   */
  restaurantIds?: string[] | null;
  /** When true, only active (non-terminal) orders. Default false = all. */
  activeOnly?: boolean;
  /**
   * Only orders created at or after this instant. Lets the board default to a
   * bounded window (today / last 7 days) instead of relying on `take` to
   * silently truncate an all-time list.
   */
  since?: Date;
  take?: number;
}

export interface ListOrdersResult {
  orders: OrderView[];
  /**
   * True when the `take` cap hid older matching orders. The boards surface this
   * so staff know the list is partial — previously it truncated silently, which
   * on a busy day meant the "toutes" filter quietly lied about the history.
   */
  truncated: boolean;
}

/**
 * List orders for the workspace owner's restaurants, newest first. Optionally
 * scoped to one restaurant, to active (non-terminal) statuses, and/or to a
 * created-at window. The restaurant filter is validated against the owner so a
 * member/owner can't read another workspace's orders.
 *
 * Deliberately NOT cursor-paginated. These boards poll every 6–8s and re-render
 * the whole list; "page 2 of a live queue" is not a coherent thing to offer, and
 * a cursor would go stale between polls. Instead the cap stays, and the caller is
 * told when it bit so it can say so. If deep history browsing is ever needed it
 * belongs in a separate, non-polled screen with its own query.
 */
export async function listOrders({
  ownerId,
  restaurantId,
  restaurantIds,
  activeOnly = false,
  since,
  take = 200
}: ListOrdersArgs): Promise<ListOrdersResult> {
  try {
    // Fetch one extra row to detect truncation without a second count query.
    const rows = await db.order.findMany({
      where: {
        restaurant: { userId: ownerId },
        // A single explicit restaurant wins (the caller has already authorized
        // it). Otherwise fall back to the member's restaurant SCOPE: without
        // this, "all restaurants" on the Commandes/Cuisine board meant every
        // branch the OWNER has, including ones this member doesn't work in.
        // `restaurantFkFilter` is empty for owners and unscoped members.
        ...(restaurantId
          ? { restaurantId }
          : restaurantFkFilter(restaurantIds ?? null)),
        ...(activeOnly ? { status: { in: ACTIVE_ORDER_STATUSES } } : {}),
        ...(since ? { createdAt: { gte: since } } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      include: {
        restaurant: {
          select: { name: true, currency: true, address: true, phone: true }
        },
        items: true
      }
    });

    const truncated = rows.length > take;
    return {
      orders: (truncated ? rows.slice(0, take) : rows).map(mapOrder),
      truncated
    };
  } catch {
    return { orders: [], truncated: false };
  }
}

/**
 * Confirm an order belongs to the given workspace owner (via its restaurant).
 * Returns the order's id, type and CURRENT status when owned, else null. The
 * current status is needed to validate the requested transition server-side
 * (see `lib/order-flow.ts`), not just the target status.
 */
export async function assertOrderOwned(
  orderId: string,
  ownerId: string
): Promise<{ id: string; type: OrderType; status: OrderStatus } | null> {
  try {
    const order = await db.order.findFirst({
      where: { id: orderId, restaurant: { userId: ownerId } },
      select: { id: true, type: true, status: true }
    });
    return order ?? null;
  } catch {
    return null;
  }
}

/**
 * Atomically claim the right to print an order's ticket.
 *
 * Returns true only for the caller that flipped `ticketPrintedAt` from null, so
 * exactly one board / tab / device can ever win, no matter how many are polling.
 * This is the real guarantee that `claimAutoPrint`'s localStorage guard could
 * only approximate — that one is per-browser and loses a race between two tabs
 * polling in the same millisecond.
 *
 * `restaurant: { userId: ownerId }` is part of the WHERE, not checked
 * afterwards, so a signed-in member cannot burn the claim on another
 * workspace's order even with a valid order id.
 *
 * Never throws: on a DB error we return false, i.e. "don't print". Printing a
 * duplicate ticket is worse than missing an auto-print, because staff can always
 * reprint manually from the order card.
 */
export async function claimTicketPrint(args: {
  orderId: string;
  ownerId: string;
}): Promise<boolean> {
  try {
    const { count } = await db.order.updateMany({
      where: {
        id: args.orderId,
        ticketPrintedAt: null,
        restaurant: { userId: args.ownerId }
      },
      data: { ticketPrintedAt: new Date() }
    });
    return count === 1;
  } catch {
    return false;
  }
}
