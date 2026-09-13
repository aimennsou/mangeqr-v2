import { NextRequest, NextResponse } from 'next/server';

import { currentUserId } from '@/lib/authentication';
import { assertRestaurantOwner } from '@/data/restaurant';
import { getPublicMenuData } from '@/app/restaurant/_shared/menu-data';

/**
 * Owner-scoped read of the REAL diner-menu data for one of the caller's own
 * restaurants, used by the "Apparence" live preview (D.4/D.5). It returns the
 * exact PublicMenuProps-shaped payload produced by `getPublicMenuData`
 * (real menus/categories/dishes + the SAVED menuAppearance), so the preview can
 * render the actual diner menu and merely re-skin it with the unsaved draft.
 *
 * Ownership is enforced: the restaurant must belong to the authenticated user,
 * otherwise a 404 is returned so another owner's restaurants stay opaque.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const restaurantId = req.nextUrl.searchParams.get('restaurantId');
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Missing required query param: restaurantId' },
        { status: 400 }
      );
    }

    // Owner-scope: the restaurant must belong to the current user.
    const owned = await assertRestaurantOwner(userId, restaurantId);
    if (!owned) {
      return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 });
    }

    const menuData = await getPublicMenuData({ id: restaurantId });
    if (!menuData) {
      return NextResponse.json({ error: 'Restaurant introuvable' }, { status: 404 });
    }

    return NextResponse.json(menuData, { status: 200 });
  } catch (error) {
    console.error('Error fetching menu preview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
