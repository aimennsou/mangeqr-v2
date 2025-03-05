import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import {  PrismaClient } from '@prisma/client';;  // Assuming you have Prisma client set up here
import { v4 as uuidv4 } from 'uuid';  // For generating new UUIDs


const getNewMenuName = async (originalName: string) => {
  let newName = originalName;
  let counter = 1;

  while (await prisma.menuCategory.findFirst({ where: { name: newName } })) {
    newName = `${originalName}-${counter}`;
    counter++;
  }

  return newName;
};




export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Extract the JSON body
    const { categoryId } = body; // The ID of the category to duplicate

    // Validate request data
    if (!categoryId) {
      console.error("Missing required fields", { categoryId });
      return NextResponse.json({ error: "Missing categoryId" }, { status: 400 });
    }

    // Step 1: Fetch the original category and its dishes
    const originalCategory = await prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: {
        dishes: true, // Include dishes in the category
      },
    });

    if (!originalCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }


    const maxPosition = await prisma.menuCategory.aggregate({
      _max: {
        position: true,
      },
      where: {
        id: originalCategory.id,
      },
    });

    const newPosition = maxPosition._max.position ? maxPosition._max.position + 1 : 1;

    const newCategoryName = await getNewMenuName(originalCategory.name);

    // Step 2: Create a new category with a new ID, copy properties
    const newCategory = await prisma.menuCategory.create({
      data: {
        id: uuidv4(), // Generate a new UUID for the category
        name: newCategoryName,
        position: newPosition, 
        logo: originalCategory.logo,
        menuId: originalCategory.menuId, // Same menu for the new category
      },
    });

    // Step 3: Duplicate the dishes under the new category
    const dishPromises = originalCategory.dishes.map(async (dish) => {
      await prisma.dish.create({
        data: {
          id: uuidv4(), // Generate a new UUID for the dish
          name: dish.name,
          description: dish.description,
          photo: dish.photo,
          state: dish.state,
          position:dish.position,
          price: dish.price,
          allergenes: dish.allergenes,
          categoryId: newCategory.id, // Link the new dish to the new category
        },
      });
    });

    // Wait for all dishes to be duplicated
    await Promise.all(dishPromises);

    // Step 4: Return the new category and its dishes data
    const duplicatedCategory = await prisma.menuCategory.findUnique({
      where: { id: newCategory.id },
      include: {
        dishes: true, // Include dishes in the response
      },
    });

    // Ensure dishes array is always returned, even if empty
    duplicatedCategory!.dishes = duplicatedCategory!.dishes || [];

    return NextResponse.json({
      message: 'Category duplicated successfully',
      duplicatedCategory, // Send back the duplicated category with dishes
    }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating category:', error);

    // Log the specific Prisma error if it's available
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code);
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
