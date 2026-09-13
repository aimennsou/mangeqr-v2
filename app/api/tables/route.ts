import { NextRequest, NextResponse } from 'next/server';

import { currentUserId } from '@/lib/authentication';
import { getWorkspaceOwnerId } from '@/data/workspace';
import { assertRestaurantOwned, getFloorPlan } from '@/data/tables';

/**
 * GET /api/tables?restaurantId=... (FEAT-2).
 *
 * Returns the restaurant's floor plan (zones + tables). Read access is scoped
 * to the workspace OWNER so members can view it too; the restaurant must belong
 * to the caller's workspace. Mutations happen through the `saveFloorPlan`
 * server action (owner-only).
 */
export async function GET(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const restaurantId = req.nextUrl.searchParams.get('restaurantId');
  if (!restaurantId) {
    return NextResponse.json(
      { error: 'restaurantId is required' },
      { status: 400 }
    );
  }

  const ownerId = await getWorkspaceOwnerId(userId);
  const owned = await assertRestaurantOwned(restaurantId, ownerId);
  if (!owned) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const plan = await getFloorPlan(restaurantId);
  return NextResponse.json(plan, { status: 200 });
}
