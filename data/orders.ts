import type { OrderStatus, OrderType } from '@prisma/client';

import { db } from '@/lib/db';

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

/**
 * List orders for the workspace owner's restaurants, newest first. Optionally
 * scoped to one restaurant, to active (non-terminal) statuses, and/or to a
 * created-at window. The restaurant filter is validated against the owner so a
 * member/owner can't read another workspace's orders.
 */
export async function listOrders({
  ownerId,
  restaurantId,
  activeOnly = false,
  since,
  take = 200
}: ListOrdersArgs): Promise<OrderView[]> {
  try {
    const orders = await db.order.findMany({
      where: {
        restaurant: { userId: ownerId },
        ...(restaurantId ? { restaurantId } : {}),
        ...(activeOnly ? { status: { in: ACTIVE_ORDER_STATUSES } } : {}),
        ...(since ? { createdAt: { gte: since } } : {})
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        restaurant: {
          select: { name: true, currency: true, address: true, phone: true }
        },
        items: true
      }
    });
    return orders.map(mapOrder);
  } catch {
    return [];
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
