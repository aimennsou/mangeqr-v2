// app/api/getTopData/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Assuming Prisma is set up correctly in lib/prisma

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Extract JSON body from the request
    const { shopId, startDate, endDate } = body;

    // Validate required fields
    if (!shopId || !startDate || !endDate) {
      return NextResponse.json({ error: 'shopId, startDate, and endDate are required.' }, { status: 400 });
    }

    // Get the most frequent CategoryId
    const topCategory = await prisma.categorydata.groupBy({
      by: ['CategoryId'],
      where: {
        shopId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _count: {
        CategoryId: true,
      },
      orderBy: {
        _count: {
          CategoryId: 'desc',
        },
      },
      take: 1,
    });

    // Get the most frequent DishId
    const topDish = await prisma.dishdata.groupBy({
      by: ['DishId'],
      where: {
        shopId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _count: {
        DishId: true,
      },
      orderBy: {
        _count: {
          DishId: 'desc',
        },
      },
      take: 1,
    });

    const topCategoryId = topCategory[0]?.CategoryId || null;
    const topDishId = topDish[0]?.DishId || null;

    // Fetch the Category name from MenuCategory based on topCategoryId
    const categoryName = topCategoryId
      ? await prisma.menuCategory.findUnique({
          where: { id: topCategoryId },
          select: { name: true },
        })
      : null;

    // Fetch the Dish name from Dish table based on topDishId
    const dishName = topDishId
      ? await prisma.dish.findUnique({
          where: { id: topDishId },
          select: { name: true },
        })
      : null;

    return NextResponse.json({
     
      topCategoryName: categoryName?.name || null,
    
      topDishName: dishName?.name || null,
    });
  } catch (error) {
    console.error('Error fetching top category and dish:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
