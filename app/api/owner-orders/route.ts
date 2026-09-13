import { NextRequest, NextResponse } from 'next/server';

import { currentUserId } from '@/lib/authentication';
import { getWorkspaceOwnerId } from '@/data/workspace';
import { listOrders } from '@/data/orders';

/**
 * GET /api/owner-orders (FEAT-1) — owner/staff order feed for the Commandes and
 * Kitchen views (polled). Scoped to the caller's workspace owner, so owners and
 * members both see the same restaurants' orders (D6). Never public.
 *
 * Query params:
 *   - restaurantId (optional): scope to one restaurant.
 *   - activeOnly=1 (optional): only non-terminal statuses (kitchen board).
 */
export async function GET(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ownerId = await getWorkspaceOwnerId(userId);
  const { searchParams } = req.nextUrl;
  const restaurantId = searchParams.get('restaurantId') ?? undefined;
  const activeOnly = searchParams.get('activeOnly') === '1';

  const orders = await listOrders({ ownerId, restaurantId, activeOnly });
  return NextResponse.json({ orders }, { status: 200 });
}
