
import { NextRequest , NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {  PrismaClient } from '@prisma/client';
import { currentUserId } from '@/lib/authentication';


const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, availability, state, restaurantId } = await req.json();

    // Validate request data
    if (!name || !state || !restaurantId) {
      console.error("Missing required fields", { name, state, restaurantId });
      return NextResponse.json({ error: "Il manque des informations" }, { status: 400 });
    }

    // Fetch the restaurant and user associated with the provided restaurantId
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { user: true },
    });

    if (!restaurant || !restaurant.user) {
      return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
    }

    const user = restaurant.user;

    // Determine the menu limit based on the user's plan
     //    const menuLimit = user.plan === "Pro" ? 6 : user.plan === "Premium" ? 14 : Infinity;

    // Count menus owned by the user
    const menuCount = await prisma.menu.count({
      where: {
        restaurant: {
          userId: user.id,
        },
      },
    });

    if (menuCount >= 6) {
      return NextResponse.json(
        { error: `Limite de menus atteinte. Votre plan permet jusqu'à ${6} menus.` },
        { status: 400 }
      );
    }

    // Proceed with creating the new menu
    const id = uuidv4();
    console.log("Generated UUID:", id);

    // Log data before attempting to create the menu
    console.log("Attempting to create menu with data:", { id, name, availability, state, restaurantId });


    const maxPosition = await prisma.menu.aggregate({
      _max: {
        position: true,
      },
    });
    
    const position = maxPosition._max.position ? maxPosition._max.position + 1 : 1;

    const newMenu = await prisma.menu.create({
      data: {
        id: id,
        name,
        availability,
        position: position,
        state: state || 'ACTIVE',
        restaurantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("api/menu created this menu:", newMenu);

    return NextResponse.json(newMenu, { status: 201 });
  } catch (error) {
    console.error('Error creating menu:', error);



    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// Update an Offer
export async function PUT(req: NextRequest) {
  try {
    const { id, restaurantId, state, name, availability } = await req.json();

    // Ensure the ID is always provided, as it's required for the update
    if (!id) {
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 });
    }

    // Log the incoming data to verify values
    console.log('Request Data:', { id, restaurantId, state, name, availability });

    // Check if restaurantId exists
    if (restaurantId) {
      const shopExists = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });

      if (!shopExists) {
        return NextResponse.json({ error: "restaurant not found" }, { status: 400 });
      }
    }

    // Prepare the data to update
    const dataToUpdate: any = { updatedAt: new Date() }; // Always update the timestamp

    if (state) {
      dataToUpdate.state = state;
    }
    if (name) {
      dataToUpdate.name = name;
    }
    if (availability) {
      dataToUpdate.availability = availability;
    }
    if (restaurantId) {
      dataToUpdate.restaurantId = restaurantId;
    }

    // If no valid fields to update, return an error
    if (Object.keys(dataToUpdate).length === 1) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Update the menu with the provided data
    const updatedOffer = await prisma.menu.update({
      where: { id },
      data: dataToUpdate,
    });

    console.log('Updated Offer:', updatedOffer);

    return NextResponse.json(updatedOffer, { status: 200 });
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}





// Delete an Offer
export async function DELETE(req: NextRequest) {
  try {
    // Parse the request body and log it
    const body = await req.json();
    console.log("api/menu is deleting this menu :", body);

    const { id, ids } = body;

    // Validate that either 'id' or 'ids' is present in the request body
    if (!id && !ids) {
      console.error("Missing 'id' or 'ids' in request body");
      return NextResponse.json({ error: "Missing required field: id or ids" }, { status: 400 });
    }

    if (ids && Array.isArray(ids)) {
      // Delete multiple records
      await prisma.menu.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
    } else if (id) {
      // Delete a single record
      await prisma.menu.delete({
        where: { id },
      });
    }

    return NextResponse.json({ message: "Offer(s) deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error('Error deleting offer:', error);

    // Handle specific Prisma error for not found
    if (error) {
      return NextResponse.json({ error: "Offer(s) not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}




// Get a specific Offer by ID (optional)



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

    // Step 3: Extract all the restaurant IDs
    const shopIds = user.restaurants.map((restaurant) => restaurant.id);

    // Step 4: Fetch all menus associated with these restaurant IDs, including the related restaurant details
    const menus = await prisma.menu.findMany({
      where: {
        restaurantId: {
          in: shopIds,
        },
      },
      include: {
        restaurant: true,
      },
    });

    console.log("api/menu fetched this menuu :" , menus)
    // Step 5: Return the menus (including restaurant details) as the response
    return NextResponse.json(menus, { status: 200 });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json({ error: "Failed to fetch menus" }, { status: 500 });
  }
}
