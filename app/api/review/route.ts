import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/lib/db';
import { currentUserId } from '@/lib/authentication';
import { getRestaurantScope } from '@/data/workspace';
import { scopedRestaurantWhere } from '@/lib/restaurant-scope';
import { blockIfNoPermission } from '@/lib/trial-guard';
import { PUBLIC_LIMITS, blockIfRateLimited } from '@/lib/rate-limit';

/**
 * POST — create a review. Called publicly from the diner-facing menu, so it is
 * NOT authenticated. Writes against the current Restaurant schema.
 * Body: { restaurantId, review (rating 0-5), message?, clientEmail?, clientNumero?, state? }
 *
 * Rate limited per IP: an unauthenticated insert with no bound let anyone stuff a
 * restaurant's ratings. Leaving a review is a one-off action per diner, so the
 * limit is tight compared with the other public routes.
 */
export async function POST(req: NextRequest) {
  const limited = blockIfRateLimited(
    req,
    PUBLIC_LIMITS.createReview.bucket,
    PUBLIC_LIMITS.createReview.limit,
    PUBLIC_LIMITS.createReview.windowMs
  );
  if (limited) return limited;

  try {
    const { restaurantId, review, message, clientEmail, clientNumero, state } =
      await req.json();

    // Validate request data
    if (!restaurantId || review === undefined || review === null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure the restaurant exists before creating a review for it.
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const newReview = await db.review.create({
      data: {
        id: uuidv4(),
        restaurantId,
        review: Number(review),
        message: message || null,
        clientEmail: clientEmail || null,
        clientNumero: clientNumero || null,
        state: state === 'GOOGLE' ? 'GOOGLE' : 'MANGEQR',
        createdAt: new Date(),
      },
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET — list reviews for all restaurants in the caller's workspace. Scoped to
 * the workspace owner so a member viewing the page sees the owner's reviews
 * read-only.
 */
export async function GET() {
  try {
    const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only the GET is gated: POST on this route is PUBLIC (a diner submitting a
    // review from the QR menu — see publicRoutePrefixes in routes.ts).
    const denied = await blockIfNoPermission(userId, 'reviews');
    if (denied) return denied;

    const { ownerId, restaurantIds } = await getRestaurantScope(userId);

    const reviews = await db.review.findMany({
      where: {
        restaurant: {
          userId: ownerId,
        },
      },
      include: {
        restaurant: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews, { status: 200 });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
