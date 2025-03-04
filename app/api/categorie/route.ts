
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { PrismaClient } from '@prisma/client';
import { currentUserId } from '@/lib/authentication';


const prisma = new PrismaClient();


export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Extract the JSON body

    const { categoryName, selectedIcon, state,   menuId } = body;

    // Validate the required fields
    if (!categoryName || !selectedIcon || !menuId) {
      console.error("Missing required fields", { categoryName, selectedIcon, menuId });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = uuidv4();
    console.log("Generated UUID:", id);

    // Log the data before attempting to create the category
    console.log("Attempting to create category with data:", { id, categoryName, selectedIcon, state,   menuId });



    const maxPosition = await prisma.menuCategory.aggregate({
      _max: {
        position: true,
      },
    });
    
    const position = maxPosition._max.position ? maxPosition._max.position + 1 : 1;


    // Create the new category in the database
    const newCategorie = await prisma.menuCategory.create({
      data: {
        id: id,
        name : categoryName,            // Use 'name' for the category name
        logo: selectedIcon, // Assuming 'selectedIcon' is the logo field
        state: 'ACTIVE',
        position:  position,
        menuId,          // Associate the category with the menu
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("Category created successfully:", newCategorie);

    // Return the newly created category
    return NextResponse.json(newCategorie, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);



    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
// Update an Offer
export async function PUT(req: NextRequest) {
    try {
      const { id, name, logo , state,
        position } = await req.json();
  
      // Validate request data
      if (!id) {
        return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
      }
  
      const updatedCategory = await prisma.menuCategory.update({
        where: { id },
        data: {
          name,
          logo,
          state: 'ACTIVE',
          position: 6,
          updatedAt: new Date(),
        },
      });
  
      return NextResponse.json(updatedCategory, { status: 200 });
    } catch (error) {
      console.error('Error updating category:', error);

      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
// Delete a Category
export async function DELETE(req: NextRequest) {
    try {
      const { id } = await req.json();
  
      // Validate request data
      if (!id) {
        return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
      }
  
      await prisma.menuCategory.delete({
        where: { id },
      });
  
      return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 });
    } catch (error) {
      console.error('Error deleting category:', error);

      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
  

// Get a specific Offer by ID (optional)



// Get all Categories for the authenticated user's restaurants
export async function GET() {
  try {
    // Step 1: Get the authenticated user's ID
  const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Find the user in the database and include their restaurants
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurants: true,
      },
    });

    if (!user || !user.restaurants || user.restaurants.length === 0) {
      return NextResponse.json({ error: "No restaurants found for this user" }, { status: 404 });
    }

    // Step 3: Extract all the shop IDs
    const shopIds = user.restaurants.map((shop) => shop.id);

    // Step 4: Fetch all categories with dishes associated with these shop IDs through their menus
    const categories = await prisma.menuCategory.findMany({
      where: {
        menu: {
          restaurantId: {
            in: shopIds,
          },
        },
      },
      include: {
        menu: {
          include: {
            restaurant: true, // Include the shop details
          },
        },
        dishes: true, // Include the dishes for each category
      },
    });

    console.log("Categories: ", categories);

    // Step 5: Return the categories (including related menu, shop, and dishes details) as the response
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

