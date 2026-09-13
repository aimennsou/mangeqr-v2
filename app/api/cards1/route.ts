// app/api/cards/route.ts (or pages/api/cards.ts if you're using pages directory)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopId, restaurantId, startDate, endDate } = body;
    const targetRestaurantId = restaurantId ?? shopId;

    if (!targetRestaurantId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields: restaurantId, startDate, or endDate' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Query total scans in the date range for the specified restaurant
    const totalScans = await db.scanData.count({
      where: {
        restaurantId: targetRestaurantId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Query total reviews in the date range for the specified restaurant
    const totalReviews = await db.review.count({
      where: {
        restaurantId: targetRestaurantId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    return NextResponse.json({ scans: totalScans, reviews: totalReviews });
  } catch (error) {
    console.error('Error fetching card data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
