import { db } from '@/lib/db';

/**
 * Design-order data layer (server-only reads).
 *
 * Design orders are scoped to the workspace OWNER (userId), mirroring how
 * menus/categories are scoped. These are plain server reads (no 'use server')
 * and must never be imported into client components.
 */

export interface DesignOrderSummary {
  id: string;
  restaurantId: string;
  restaurantName: string | null;
  designId: string;
  designName: string;
  quantity: number;
  status: string;
  deliveryMethod: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * List a workspace owner's design orders, newest first, with the restaurant
 * name joined for display.
 */
export async function listDesignOrders(
  ownerId: string
): Promise<DesignOrderSummary[]> {
  try {
    const orders = await db.designOrder.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' },
      include: { restaurant: { select: { name: true } } },
    });

    return orders.map((o) => ({
      id: o.id,
      restaurantId: o.restaurantId,
      restaurantName: o.restaurant?.name ?? null,
      designId: o.designId,
      designName: o.designName,
      quantity: o.quantity,
      status: o.status,
      deliveryMethod: o.deliveryMethod ?? null,
      notes: o.notes ?? null,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));
  } catch {
    return [];
  }
}
