import { NextRequest, NextResponse } from 'next/server';
import {  PrismaClient } from '@prisma/client';;

export async function POST(req: NextRequest) {
  try {
    const updatedDishes = await req.json();

    console.log("Received data at /api/dish/position:", updatedDishes);

    if (!Array.isArray(updatedDishes)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Validate each dish object
    for (const dish of updatedDishes) {
      if (
        typeof dish.dishId !== 'string' ||
        typeof dish.position !== 'number' ||
        typeof dish.categoryId !== 'string'
      ) {
        return NextResponse.json({ error: "Invalid dish data" }, { status: 400 });
      }
    }

    // Update dish positions in a transaction
    await prisma.$transaction(
      updatedDishes.map((dish) =>
        prisma.dish.update({
          where: { id: dish.dishId },
          data: { position: dish.position, categoryId: dish.categoryId }, // Update both position and categoryId
        })
      )
    );

    return NextResponse.json({ message: "Dish positions updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating dish positions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
