// app/api/getTopData/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Extract JSON body from the request
    const { shopId, restaurantId, startDate, endDate } = body;
    const targetRestaurantId = restaurantId ?? shopId;

    // Validate required fields
    if (!targetRestaurantId || !startDate || !endDate) {
      return NextResponse.json({ error: 'restaurantId, startDate, and endDate are required.' }, { status: 400 });
    }

    // Get the most frequently viewed category
    const topCategory = await db.categoryData.groupBy({
      by: ['categoryId'],
      where: {
        restaurantId: targetRestaurantId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _count: {
        categoryId: true,
      },
      orderBy: {
        _count: {
          categoryId: 'desc',
        },
      },
      take: 1,
    });

    // Get the most FAVORITED dish (heart clicks) — signal for "Le plat favoris".
    const topDish = await db.favoriteData.groupBy({
      by: ['dishId'],
      where: {
        restaurantId: targetRestaurantId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _count: {
        dishId: true,
      },
      orderBy: {
        _count: {
          dishId: 'desc',
        },
      },
      take: 1,
    });

    const topCategoryId = topCategory[0]?.categoryId || null;
    const topDishId = topDish[0]?.dishId || null;
    const topDishFavorites = topDish[0]?._count.dishId ?? 0;

    // Fetch the Category name from MenuCategory based on topCategoryId
    const categoryName = topCategoryId
      ? await db.menuCategory.findUnique({
          where: { id: topCategoryId },
          select: { name: true },
        })
      : null;

    // Fetch the Dish name from Dish table based on topDishId
    const dishName = topDishId
      ? await db.dish.findUnique({
          where: { id: topDishId },
          select: { name: true },
        })
      : null;

    return NextResponse.json({
      topCategoryName: categoryName?.name || null,
      // Most-favorited dish + how many times it was favorited.
      topDishName: dishName?.name || null,
      topDishFavorites,
    });
  } catch (error) {
    console.error('Error fetching top category and dish:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
