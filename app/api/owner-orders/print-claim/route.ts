import { NextRequest, NextResponse } from 'next/server';

import { currentUserId } from '@/lib/authentication';
import { getWorkspaceOwnerId, memberCanAccess } from '@/data/workspace';
import { claimTicketPrint } from '@/data/orders';

/**
 * POST /api/owner-orders/print-claim — claim the right to auto-print an order's
 * ticket. Body: `{ orderId }`. Responds `{ claimed: boolean }`.
 *
 * Exactly one caller can ever get `claimed: true` for a given order, because the
 * claim is a conditional UPDATE on `Order.ticketPrintedAt` (see
 * `claimTicketPrint`). Staff commonly have Commandes and Cuisine open on two
 * devices; before this, each open board printed its own ticket.
 *
 * Deliberately NOT under /api/orders. That prefix is in `publicRoutePrefixes`
 * (diners POST their orders there without a session), so a sibling route would
 * have inherited public access and let anyone who guessed an order uuid burn its
 * print claim. /api/owner-orders is not public and already gates on the `orders`
 * permission.
 */
export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await memberCanAccess(userId, 'orders'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let orderId: unknown;
  try {
    ({ orderId } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof orderId !== 'string' || orderId.length === 0) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const ownerId = await getWorkspaceOwnerId(userId);
  const claimed = await claimTicketPrint({ orderId, ownerId });

  return NextResponse.json({ claimed }, { status: 200 });
}
