import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';

/**
 * GET /api/orders/[id] (FEAT-1) — PUBLIC read of a single order's status for
 * the diner's live tracking page. Returns only diner-relevant fields (no owner
 * data). The order id is an unguessable uuid, which acts as the access token.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const order = await db.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumber: true,
      type: true,
      status: true,
      tableLabel: true,
      total: true,
      createdAt: true,
      restaurant: { select: { name: true, currency: true } },
      items: {
        select: {
          id: true,
          dishName: true,
          quantity: true,
          lineTotal: true,
          addons: true,
          specialRequest: true
        }
      }
    }
  });

  if (!order) {
    return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
  }

  return NextResponse.json(order, { status: 200 });
}
