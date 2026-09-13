import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUserId } from '@/lib/authentication';
import { getWorkspaceOwnerId } from '@/data/workspace';

export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ownerId = await getWorkspaceOwnerId(userId);

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

    // Resolve which target categoryIds actually belong to the caller's workspace,
    // so we never move a dish into a category outside the workspace.
    const targetCategoryIds = Array.from(
      new Set(updatedDishes.map((d) => d.categoryId as string))
    );
    const ownedCategories = await db.menuCategory.findMany({
      where: {
        id: { in: targetCategoryIds },
        menu: { restaurant: { userId: ownerId } },
      },
      select: { id: true },
    });
    const ownedCategoryIds = new Set(ownedCategories.map((c) => c.id));

    // Only update dishes whose SOURCE belongs to the caller's workspace and whose
    // TARGET category also belongs to it. Scoping the updateMany `where` makes
    // cross-workspace writes no-ops.
    await db.$transaction(
      updatedDishes
        .filter((dish) => ownedCategoryIds.has(dish.categoryId as string))
        .map((dish) =>
          db.dish.updateMany({
            where: {
              id: dish.dishId,
              category: { menu: { restaurant: { userId: ownerId } } },
            },
            data: { position: dish.position, categoryId: dish.categoryId },
          })
        )
    );

    return NextResponse.json({ message: "Dish positions updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating dish positions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
