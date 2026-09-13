import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Parse JSON body
    const restaurantId = body.restaurantId ?? body.shopId;

    if (!restaurantId || typeof restaurantId !== 'string') {
      return NextResponse.json({ error: 'Invalid restaurantId' }, { status: 400 });
    }

    // Fetch reviews for the restaurant
    const reviews = await db.review.findMany({
      where: { restaurantId },
    });

    // Calculate total reviews and average rating
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.review, 0) / totalReviews
        : 0;

    // Return the data
    return NextResponse.json({
      reviews,
      totalReviews,
      averageRating,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
