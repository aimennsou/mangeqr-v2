import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { currentUserId } from '@/lib/authentication';

/**
 * POST — fetch a single restaurant (settings view) owned by the current user.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const restaurant = await db.restaurant.findFirst({
      where: { id, userId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json(restaurant, { status: 200 });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 });
  }
}

/**
 * PUT — update a restaurant's visibility toggles (wifi/website/social state).
 */
export async function PUT(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, wifistate, websitestate, instagramstate, tiktokstate, googlestate } =
      await req.json();

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: 'Missing restaurant ID' }, { status: 400 });
    }

    // Ownership check
    const existing = await db.restaurant.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const dataToUpdate: any = { updatedAt: new Date() };
    if (wifistate !== undefined) dataToUpdate.wifistate = wifistate;
    if (websitestate !== undefined) dataToUpdate.websitestate = websitestate;
    if (instagramstate !== undefined) dataToUpdate.instagramstate = instagramstate;
    if (tiktokstate !== undefined) dataToUpdate.tiktokstate = tiktokstate;
    if (googlestate !== undefined) dataToUpdate.googlestate = googlestate;

    const updatedSettings = await db.restaurant.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedSettings, { status: 200 });
  } catch (error) {
    console.error('Error updating restaurant settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
