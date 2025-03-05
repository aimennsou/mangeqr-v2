// app/api/cards/route.ts (or pages/api/cards.ts if you're using pages directory)

import { NextRequest, NextResponse } from 'next/server';
import {  PrismaClient } from '@prisma/client';; // Adjust the path to your prisma client setup

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopId, startDate, endDate } = body;

    if (!shopId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields: shopId, startDate, or endDate' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Query total scans in the date range for the specified shopId
    const totalScans = await prisma.scandata.count({
      where: {
        shopId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Query total reviews in the date range for the specified shopId
    const totalReviews = await prisma.review.count({
      where: {
        shopId,
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
