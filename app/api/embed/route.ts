import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { shopId } = await req.json(); // Parse JSON body

    if (!shopId || typeof shopId !== 'string') {
      return NextResponse.json({ error: 'Invalid shopId' }, { status: 400 });
    }

    // Fetch reviews based on the shopId
    const reviews = await prisma.review.findMany({
      where: { shopId },
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
