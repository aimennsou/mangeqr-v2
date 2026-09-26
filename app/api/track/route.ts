import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PUBLIC_LIMITS, rateLimit } from '@/lib/rate-limit';

/**
 * Public, unauthenticated analytics tracking endpoint used by the diner-facing
 * menu. Records engagement events (scan / category view / dish view) so the
 * owner's performance dashboard has real data.
 *
 * Body: { type: 'scan' | 'category' | 'dish' | 'favorite', restaurantId, categoryId?, dishId? }
 *
 * Writes are best-effort: any failure returns 200 so tracking never disrupts
 * the diner experience.
 *
 * Rate limited per IP, because every accepted call INSERTS a row and there was
 * no bound at all — a script could grow ScanData/CategoryData/DishData without
 * limit and poison the owner's KPIs. Over the limit we return 200 `{ ok: false }`
 * rather than 429, keeping the "tracking never disrupts the diner" contract: the
 * caller is fire-and-forget and must not see an error.
 */
export async function POST(req: NextRequest) {
  if (
    !rateLimit(
      req,
      PUBLIC_LIMITS.track.bucket,
      PUBLIC_LIMITS.track.limit,
      PUBLIC_LIMITS.track.windowMs
    ).ok
  ) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  try {
    const { type, restaurantId, categoryId, dishId } = await req.json();

    if (!restaurantId || !type) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    // Confirm the restaurant exists before writing (avoids orphan rows / FK errors).
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });

    if (!restaurant) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    switch (type) {
      case 'scan':
        await db.scanData.create({ data: { restaurantId } });
        break;
      case 'category':
        if (categoryId) {
          await db.categoryData.create({ data: { restaurantId, categoryId } });
        }
        break;
      case 'dish':
        if (dishId) {
          await db.dishData.create({ data: { restaurantId, dishId } });
        }
        break;
      case 'favorite':
        // A diner tapped the heart on a dish. Each tap is counted (drives the
        // "Le plat favoris" KPI).
        if (dishId) {
          await db.favoriteData.create({ data: { restaurantId, dishId } });
        }
        break;
      default:
        break;
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Error recording tracking event:', error);
    // Never fail the diner request over analytics.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
