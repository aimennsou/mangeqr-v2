// /pages/api/plat/duplicate.ts
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';  // shared Prisma client
import { currentUserId } from '@/lib/authentication';
import { getWorkspaceOwnerId } from '@/data/workspace';
import { v4 as uuidv4 } from 'uuid';  // For generating new UUIDs



const getNewMenuName = async (originalName: string) => {
  let newName = originalName;
  let counter = 1;

  while (await db.dish.findFirst({ where: { name: newName } })) {
    newName = `${originalName}-${counter}`;
    counter++;
  }

  return newName;
};


export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ownerId = await getWorkspaceOwnerId(userId);

    const body = await req.json(); // Extract the JSON body
    const { platId } = body; // The ID of the plat (dish) to duplicate

    // Validate request data
    if (!platId) {
      console.error("Missing required fields", { platId });
      return NextResponse.json({ error: "Missing platId" }, { status: 400 });
    }

    // Step 1: Fetch the original dish
    const originalDish = await db.dish.findUnique({
      where: { id: platId },
      include: {
        category: true, // Include category to link the new dish under the same category
      },
    });

    if (!originalDish) {
      return NextResponse.json({ error: "Dish not found" }, { status: 404 });
    }

    // Workspace ownership: the source dish must belong to the caller's owner.
    const ownedDish = await db.dish.findFirst({
      where: {
        id: platId,
        category: { menu: { restaurant: { userId: ownerId } } },
      },
      select: { id: true },
    });
    if (!ownedDish) {
      return NextResponse.json(
        { error: "Action réservée au propriétaire du compte." },
        { status: 403 }
      );
    }


    const maxPosition = await db.dish.aggregate({
      _max: {
        position: true,
      },
      where: {
        id: originalDish.id,
      },
    });

    const newPosition = maxPosition._max.position ? maxPosition._max.position + 1 : 1;

    const newPlatName = await getNewMenuName(originalDish.name);

    // Step 2: Create a new dish with a new ID, copy the properties
    const newDish = await db.dish.create({
      data: {
        id: uuidv4(), // Generate a new UUID for the dish
        name: newPlatName,
        description: originalDish.description,
        photo: originalDish.photo,
        price: originalDish.price,
        state : originalDish.state,
        position: newPosition,
        allergenes: originalDish.allergenes,
        categoryId: originalDish.category.id, // Link to the same category
      },
    });

    // Step 3: Return the new dish data or success response
    return NextResponse.json({
      message: "Dish duplicated successfully",
      duplicatedDish: newDish, // Return the new duplicated dish
    }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating dish:', error);

    // Log the specific Prisma error if it's available
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code);
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
