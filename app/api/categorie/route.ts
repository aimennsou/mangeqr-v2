
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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

    const body = await req.json(); // Extract the JSON body

    const { categoryName, selectedIcon, state,   menuId } = body;

    // Validate the required fields
    if (!categoryName || !selectedIcon || !menuId) {
      console.error("Missing required fields", { categoryName, selectedIcon, menuId });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Workspace ownership: the parent menu must belong to the caller's owner.
    const ownedMenu = await db.menu.findFirst({
      where: { id: menuId, restaurant: { userId: ownerId } },
      select: { id: true },
    });
    if (!ownedMenu) {
      return NextResponse.json(
        { error: "Action réservée au propriétaire du compte." },
        { status: 403 }
      );
    }

    const id = uuidv4();

    const maxPosition = await db.menuCategory.aggregate({
      _max: {
        position: true,
      },
    });
    
    const position = maxPosition._max.position ? maxPosition._max.position + 1 : 1;


    // Create the new category in the database
    const newCategorie = await db.menuCategory.create({
      data: {
        id: id,
        name : categoryName,            // Use 'name' for the category name
        logo: selectedIcon, // Assuming 'selectedIcon' is the logo field
        state: state || 'ACTIVE',
        position:  position,
        menuId,          // Associate the category with the menu
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

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
      const userId = await currentUserId();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const ownerId = await getWorkspaceOwnerId(userId);

      const { id, name, logo , state,
        position } = await req.json();
  
      // Validate request data
      if (!id) {
        return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
      }

      // Workspace ownership: the category must belong to the caller's owner
      // (via its menu → restaurant). Blocks cross-workspace edits.
      const ownedCategory = await db.menuCategory.findFirst({
        where: { id, menu: { restaurant: { userId: ownerId } } },
        select: { id: true },
      });
      if (!ownedCategory) {
        return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
      }

      const dataToUpdate: any = { updatedAt: new Date() };

      if (name !== undefined) dataToUpdate.name = name;
      if (logo !== undefined) dataToUpdate.logo = logo;
      if (state !== undefined) dataToUpdate.state = state;
      if (position !== undefined) dataToUpdate.position = position;

      const updatedCategory = await db.menuCategory.update({
        where: { id },
        data: dataToUpdate,
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
      const userId = await currentUserId();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const ownerId = await getWorkspaceOwnerId(userId);

      const { id, ids } = await req.json();
  
      // Validate request data
      if (!id && !ids) {
        return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
      }

      const targetIds: string[] = Array.isArray(ids) ? ids : id ? [id] : [];

      // Scope the delete to categories within the caller's workspace only.
      await db.menuCategory.deleteMany({
        where: {
          id: { in: targetIds },
          menu: { restaurant: { userId: ownerId } },
        },
      });
  
      return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 });
    } catch (error) {
      console.error('Error deleting category:', error);

      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
  

// Get a specific Offer by ID (optional)



// Get all Categories for the authenticated user's restaurants
export async function GET(req: NextRequest) {
  try {
    // Step 1: Get the authenticated user's ID
  const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve the workspace owner so a member sees the OWNER's categories.
    const ownerId = await getWorkspaceOwnerId(userId);

    // Optional server-side scoping: `?menuId=` limits the result to a single
    // menu's categories instead of returning the whole workspace catalog (with
    // every dish) and filtering client-side. Omitting it preserves old behavior.
    const menuIdFilter = req.nextUrl.searchParams.get("menuId");

    // Step 2: Find the workspace owner and include their restaurant IDs.
    const user = await db.user.findUnique({
      where: { id: ownerId },
      include: {
        restaurants: { select: { id: true } },
      },
    });

    if (!user || !user.restaurants || user.restaurants.length === 0) {
      return NextResponse.json({ error: "No restaurants found for this user" }, { status: 404 });
    }

    // Step 3: Extract all the shop IDs the workspace owns.
    const shopIds = user.restaurants.map((shop) => shop.id);

    // Step 4: Fetch categories with dishes. Ownership is always enforced via the
    // restaurant scope; the optional menuId narrows to a single menu. The
    // nested menu→restaurant include is only kept for the unscoped (legacy)
    // response since scoped callers don't use it.
    const categories = await db.menuCategory.findMany({
      where: {
        menu: {
          restaurantId: { in: shopIds },
          ...(menuIdFilter ? { id: menuIdFilter } : {}),
        },
      },
      include: menuIdFilter
        ? { dishes: true }
        : {
            menu: {
              include: {
                restaurant: true, // legacy shape: shop details
              },
            },
            dishes: true,
          },
    });

    // Step 5: Return the categories (with their dishes) as the response
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

