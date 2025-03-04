import { Prisma, PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { v4 as uuidv4 } from 'uuid';
const prisma = new PrismaClient();
// Function to get a new name for the duplicated menu
const getNewMenuName = async (originalName: string) => {
  let newName = originalName;
  let counter = 1;

  while (await prisma.menu.findFirst({ where: { name: newName } })) {
    newName = `${originalName}-${counter}`;
    counter++;
  }

  return newName;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { menuId } = body;

    if (!menuId) {
      return NextResponse.json({ error: "Missing menuId" }, { status: 400 });
    }

    // Fetch the original menu and related restaurant
    const originalMenu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        categories: { include: { dishes: true } },
        restaurant: { include: { user: true } },
      },
    });

    if (!originalMenu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    const user = originalMenu.restaurant?.user;

    if (!user) {
      return NextResponse.json({ error: "User not found for the menu's restaurant" }, { status: 404 });
    }

    // Determine the menu limit based on the user's plan
     //const menuLimit = user.plan === "Pro" ? 7 : user.plan === "Premium" ? 14 : Infinity;

    // Count menus owned by the user
    const menuCount = await prisma.menu.count({
      where: {
        restaurant: {
          userId: user.id,
        },
      },
    });

    if (menuCount >= 7) {
      return NextResponse.json(
        { error: `Menu limit reached. Your plan allows up to ${7} menus.` },
        { status: 400 }
      );
    }

    // Fetch the maximum position value across all available menus in the restaurant
    const maxPosition = await prisma.menu.aggregate({
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
    const newMenu = await prisma.menu.create({
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
      const newCategory = await prisma.menuCategory.create({
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
        const newDish = await prisma.dish.create({
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
