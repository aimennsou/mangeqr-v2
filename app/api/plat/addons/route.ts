import { NextRequest, NextResponse } from 'next/server';

import { currentUserId } from '@/lib/authentication';
import { getWorkspaceContext } from '@/data/workspace';
import { getDishAddonGroups, getDishOwnerId } from '@/data/addons';

/**
 * GET /api/plat/addons?dishId=... (FEAT-1/D12).
 *
 * Returns a dish's add-on groups (with options) for the OWNER add-on editor.
 * Scoped to the caller's workspace owner. The diner-facing menu loads add-ons
 * server-side via `getPublicMenuData`, so this route is for the authenticated
 * owner UI only.
 */
export async function GET(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dishId = req.nextUrl.searchParams.get('dishId');
  if (!dishId) {
    return NextResponse.json({ error: 'dishId is required' }, { status: 400 });
  }

  const { ownerId } = await getWorkspaceContext(userId);
  const dishOwnerId = await getDishOwnerId(dishId);
  if (!dishOwnerId || dishOwnerId !== ownerId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const groups = await getDishAddonGroups(dishId);
  return NextResponse.json({ groups }, { status: 200 });
}
