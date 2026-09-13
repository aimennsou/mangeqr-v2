import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { currentUserId } from '@/lib/authentication';
import { getWorkspaceOwnerId } from '@/data/workspace';
import { currencySymbol } from '@/lib/currency';

/**
 * POST /api/order-metrics (FEAT-1) — order KPIs + a daily revenue series for the
 * performances page. Scoped to the caller's workspace owner (owner + members),
 * and only for a restaurant the owner owns.
 *
 * Body: { shopId | restaurantId, startDate, endDate }
 * Returns:
 *   {
 *     orderingEnabled,
 *     currency,
 *     totalOrders, revenue, avgOrderValue,
 *     dineInCount, deliveryCount,
 *     byStatus: Record<OrderStatus, number>,
 *     daily: { date: 'YYYY-MM-DD', orders, revenue }[]
 *   }
 *
 * Cancelled orders are excluded from revenue/averages but counted in byStatus.
 */
export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const targetRestaurantId = body.restaurantId ?? body.shopId;
  const { startDate, endDate } = body;
  if (!targetRestaurantId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required fields: restaurantId, startDate, endDate' },
      { status: 400 }
    );
  }

  // Scope to the workspace owner and confirm the restaurant belongs to them.
  const ownerId = await getWorkspaceOwnerId(userId);
  const restaurant = await db.restaurant.findFirst({
    where: { id: targetRestaurantId, userId: ownerId },
    select: {
      currency: true,
      orderingEnabled: true,
      user: { select: { orderingEnabled: true } }
    }
  });
  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const orderingEnabled =
    (restaurant.user?.orderingEnabled ?? false) && restaurant.orderingEnabled;
  const currency = currencySymbol(restaurant.currency);

  const start = new Date(startDate);
  const end = new Date(endDate);

  const orders = await db.order.findMany({
    where: {
      restaurantId: targetRestaurantId,
      createdAt: { gte: start, lte: end }
    },
    select: {
      type: true,
      status: true,
      total: true,
      createdAt: true
    }
  });

  // Non-cancelled orders count toward revenue.
  const revenueOrders = orders.filter((o) => o.status !== 'CANCELLED');
  const totalOrders = orders.length;
  const revenue = revenueOrders.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = revenueOrders.length
    ? revenue / revenueOrders.length
    : 0;
  const dineInCount = orders.filter((o) => o.type === 'DINE_IN').length;
  const deliveryCount = orders.filter((o) => o.type === 'DELIVERY').length;

  const byStatus: Record<string, number> = {};
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
  }

  // Daily series (orders + revenue) keyed by YYYY-MM-DD.
  const dailyMap = new Map<string, { orders: number; revenue: number }>();
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const cur = dailyMap.get(key) ?? { orders: 0, revenue: 0 };
    cur.orders += 1;
    if (o.status !== 'CANCELLED') cur.revenue += o.total;
    dailyMap.set(key, cur);
  }
  const daily = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, orders: v.orders, revenue: v.revenue }));

  return NextResponse.json({
    orderingEnabled,
    currency,
    totalOrders,
    revenue,
    avgOrderValue,
    dineInCount,
    deliveryCount,
    byStatus,
    daily
  });
}
