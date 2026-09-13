import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUserId } from '@/lib/authentication';
import { getPlanLimits, getEffectivePlan } from '@/lib/plan';
import { getWorkspaceOwnerId } from '@/data/workspace';

import { v4 as uuidv4 } from 'uuid';
// Function to get a new name for the duplicated menu
const getNewMenuName = async (originalName: string) => {
  let newName = originalName;
  let counter = 1;

  while (await db.menu.findFirst({ where: { name: newName } })) {
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

    const body = await req.json();
    const { menuId } = body;

    if (!menuId) {
      return NextResponse.json({ error: "Missing menuId" }, { status: 400 });
    }

    // Fetch the original menu and related restaurant
    const originalMenu = await db.menu.findUnique({
      where: { id: menuId },
      include: {
        categories: { include: { dishes: true } },
        restaurant: { include: { user: true } },
      },
    });

    if (!originalMenu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Workspace ownership: the source menu must belong to the caller's owner.
    if (originalMenu.restaurant?.userId !== ownerId) {
      return NextResponse.json(
        { error: "Action réservée au propriétaire du compte." },
        { status: 403 }
      );
    }

    const user = originalMenu.restaurant?.user;

    if (!user) {
      return NextResponse.json({ error: "User not found for the menu's restaurant" }, { status: 404 });
    }

    // Determine the menu limit from the user's plan (expiry-aware).
    const menuLimit = getPlanLimits(getEffectivePlan(user)).menus;

    // Count menus owned by the user
    const menuCount = await db.menu.count({
      where: {
        restaurant: {
          userId: user.id,
        },
      },
    });

    if (menuCount >= menuLimit) {
      return NextResponse.json(
        { error: `Limite de menus atteinte. Votre plan permet jusqu'à ${menuLimit} menus.` },
        { status: 400 }
      );
    }

    // Fetch the maximum position value across all available menus in the restaurant
    const maxPosition = await db.menu.aggregate({
      _max: {
        position: true,
      },
      where: {
        restaurantId: originalMenu.restaurantId,
      },
    });

    const newPosition = maxPosition._max.position ? maxPosition._max.position + 1 : 1;

    // Generate a new name for the duplicated menu
    const newMenuName = await getNewMenuName(originalMenu.name);

    // Duplicate the menu with the new name and incremented position
    const newMenu = await db.menu.create({
      data: {
        name: newMenuName,
        position: newPosition,  // Use the incremented position here
        availability: originalMenu.availability,
        state: originalMenu.state,
        restaurantId: originalMenu.restaurantId,
      },
      include: { restaurant: true },
    });

    const newCategories = [];
    const newDishes = [];

    for (const category of originalMenu.categories) {
      const newCategory = await db.menuCategory.create({
        data: {
          id: uuidv4(),
          name: category.name,
          logo: category.logo,
          state: category.state,
          position: category.position,
          menuId: newMenu.id,
        },
      });
      newCategories.push(newCategory);

      for (const dish of category.dishes) {
        const newDish = await db.dish.create({
          data: {
            id: uuidv4(),
            name: dish.name,
            description: dish.description,
            photo: dish.photo,
            price: dish.price,
            state: dish.state,
            position: dish.position,
            allergenes: dish.allergenes,
            categoryId: newCategory.id,
          },
        });
        newDishes.push(newDish);
      }
    }

    return NextResponse.json(
      {
        menu: newMenu,
        categories: newCategories,
        dishes: newDishes,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error duplicating menu:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code);
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
