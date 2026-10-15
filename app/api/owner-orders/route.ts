import { NextRequest, NextResponse } from 'next/server';

import { currentUserId } from '@/lib/authentication';
import {
  getRestaurantScope,
  assertRestaurantInScope,
  memberCanAccess,
} from '@/data/workspace';
import { listOrders } from '@/data/orders';

/**
 * GET /api/owner-orders (FEAT-1) — owner/staff order feed for the Commandes and
 * Kitchen views (polled). Scoped to the caller's workspace owner, so owners and
 * members both see the same restaurants' orders (D6). Never public.
 *
 * Requires the `orders` permission: owners implicitly have it, members must have
 * been granted it. Without this check a member whose sidebar hides Commandes
 * could still read the whole workspace's order feed directly.
 *
 * Query params:
 *   - restaurantId (optional): scope to one restaurant.
 *   - activeOnly=1 (optional): only non-terminal statuses (kitchen board).
 *   - days=N (optional): only orders from the last N days (1 = today's rolling
 *     24h). Omitted/invalid = no time bound. Clamped to 1..365.
 */
export async function GET(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await memberCanAccess(userId, 'orders'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { ownerId, restaurantIds } = await getRestaurantScope(userId);
  const { searchParams } = req.nextUrl;
  const requestedRestaurantId = searchParams.get('restaurantId') ?? undefined;
  const activeOnly = searchParams.get('activeOnly') === '1';

  // An explicit restaurantId must be authorized before it is trusted: it arrives
  // from the client, so a member scoped to one branch could otherwise read
  // another branch's orders just by changing the query string. Rejecting (rather
  // than silently ignoring it and returning the full scope) avoids showing data
  // the caller did not ask for.
  if (requestedRestaurantId) {
    const allowed = await assertRestaurantInScope(userId, requestedRestaurantId);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Optional rolling time window. Parsed defensively: a non-numeric value means
  // "no bound" rather than an Invalid Date that silently matches nothing.
  const rawDays = Number(searchParams.get('days'));
  const since =
    Number.isFinite(rawDays) && rawDays >= 1
      ? new Date(Date.now() - Math.min(rawDays, 365) * 24 * 60 * 60 * 1000)
      : undefined;

  // `truncated` tells the board the cap hid older matching orders, so it can say
  // so instead of silently showing a partial history.
  const { orders, truncated } = await listOrders({
    ownerId,
    restaurantId: requestedRestaurantId,
    // Applied only when no explicit restaurantId — bounds the "all restaurants"
    // case to the branches this member actually works in.
    restaurantIds,
    activeOnly,
    since
  });
  return NextResponse.json({ orders, truncated }, { status: 200 });
}
