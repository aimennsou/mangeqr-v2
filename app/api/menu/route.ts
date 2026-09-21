
import { NextRequest , NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { currentUserId } from '@/lib/authentication';
import { getPlanLimits, getEffectivePlan } from '@/lib/plan';
import { getWorkspaceOwnerId } from '@/data/workspace';
import { blockIfTrialExpired } from '@/lib/trial-guard';


export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const blocked = await blockIfTrialExpired(userId);
    if (blocked) return blocked;
    // Resolve the workspace owner so members act on the owner's data.
    const ownerId = await getWorkspaceOwnerId(userId);

    const { name, availability, state, restaurantId } = await req.json();

    // Validate request data
    if (!name || !state || !restaurantId) {
      console.error("Missing required fields", { name, state, restaurantId });
      return NextResponse.json({ error: "Il manque des informations" }, { status: 400 });
    }

    // Fetch the restaurant and user associated with the provided restaurantId
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      include: { user: true },
    });

    if (!restaurant || !restaurant.user) {
      return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
    }

    // Workspace ownership: the target restaurant must belong to the caller's
    // workspace owner. Blocks writing to restaurants outside the workspace.
    if (restaurant.userId !== ownerId) {
      return NextResponse.json(
        { error: "Action réservée au propriétaire du compte." },
        { status: 403 }
      );
    }

    const user = restaurant.user;

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

    // Proceed with creating the new menu
    const id = uuidv4();

    const maxPosition = await db.menu.aggregate({
      _max: {
        position: true,
      },
    });
    
    const position = maxPosition._max.position ? maxPosition._max.position + 1 : 1;

    const newMenu = await db.menu.create({
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

    return NextResponse.json(newMenu, { status: 201 });
  } catch (error) {
    console.error('Error creating menu:', error);



    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


// Update an Offer
export async function PUT(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const blocked = await blockIfTrialExpired(userId);
    if (blocked) return blocked;
    const ownerId = await getWorkspaceOwnerId(userId);

    const { id, restaurantId, state, name, availability } = await req.json();

    // Ensure the ID is always provided, as it's required for the update
    if (!id) {
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 });
    }

    // Workspace ownership: the menu being updated must belong to the caller's
    // workspace owner (via its restaurant). Blocks cross-workspace edits.
    const ownedMenu = await db.menu.findFirst({
      where: { id, restaurant: { userId: ownerId } },
      select: { id: true },
    });
    if (!ownedMenu) {
      return NextResponse.json({ error: "Menu introuvable" }, { status: 404 });
    }

    // Check if restaurantId exists and belongs to the workspace owner
    if (restaurantId) {
      const shopExists = await db.restaurant.findFirst({
        where: { id: restaurantId, userId: ownerId },
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
    const updatedOffer = await db.menu.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedOffer, { status: 200 });
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}





// Delete an Offer
export async function DELETE(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const blocked = await blockIfTrialExpired(userId);
    if (blocked) return blocked;
    const ownerId = await getWorkspaceOwnerId(userId);

    const body = await req.json();

    const { id, ids } = body;

    // Validate that either 'id' or 'ids' is present in the request body
    if (!id && !ids) {
      console.error("Missing 'id' or 'ids' in request body");
      return NextResponse.json({ error: "Missing required field: id or ids" }, { status: 400 });
    }

    const targetIds: string[] = Array.isArray(ids) ? ids : id ? [id] : [];

    // Scope the delete to menus within the caller's workspace only, so a member
    // or owner can never delete another workspace's menus.
    await db.menu.deleteMany({
      where: {
        id: { in: targetIds },
        restaurant: { userId: ownerId },
      },
    });

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



export async function GET(req: NextRequest) {
  try {
    // Step 1: Get the authenticated user's ID
  const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve the workspace owner so a member sees the OWNER's menus.
    const ownerId = await getWorkspaceOwnerId(userId);

    // Optional server-side scoping: `?restaurantId=` limits the result to a
    // single restaurant's menus instead of shipping the whole workspace and
    // letting the client filter. Omitting it preserves the old behavior.
    const restaurantIdFilter = req.nextUrl.searchParams.get("restaurantId");

    // Step 2: Find the workspace owner and include their restaurants
    const user = await db.user.findUnique({
      where: { id: ownerId },
      include: {
        restaurants: { select: { id: true } },
      },
    });

    if (!user || !user.restaurants || user.restaurants.length === 0) {
      return NextResponse.json({ error: "No restaurants found for this user" }, { status: 404 });
    }

    // Step 3: Extract all the restaurant IDs the workspace owns.
    const shopIds = user.restaurants.map((restaurant) => restaurant.id);

    // If a restaurantId is requested, only honor it when it belongs to the
    // workspace; otherwise fall back to the full owned set. This keeps the
    // ownership guarantee intact regardless of the query param.
    const scopedShopIds =
      restaurantIdFilter && shopIds.includes(restaurantIdFilter)
        ? [restaurantIdFilter]
        : shopIds;

    // Step 4: Fetch menus for the scoped restaurant IDs, including the related restaurant details
    const menus = await db.menu.findMany({
      where: {
        restaurantId: {
          in: scopedShopIds,
        },
      },
      include: {
        restaurant: true,
      },
    });

    // Step 5: Return the menus (including restaurant details) as the response
    return NextResponse.json(menus, { status: 200 });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json({ error: "Failed to fetch menus" }, { status: 500 });
  }
}
