
import { NextRequest , NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { currentUserId } from '@/lib/authentication';
import { getWorkspaceOwnerId, logMemberActivity } from '@/data/workspace';
import { blockIfTrialExpired } from '@/lib/trial-guard';


export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const blocked = await blockIfTrialExpired(userId);
    if (blocked) return blocked;
    const ownerId = await getWorkspaceOwnerId(userId);

    const { name, description, photo, price, 
     categoryId, allergenes } = await req.json();
    
    // Validate required fields
    if (!name || !price || !categoryId || !allergenes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Workspace ownership: the parent category must belong to the caller's owner
    // (via its menu → restaurant).
    const ownedCategory = await db.menuCategory.findFirst({
      where: { id: categoryId, menu: { restaurant: { userId: ownerId } } },
      select: { id: true },
    });
    if (!ownedCategory) {
      return NextResponse.json(
        { error: "Action réservée au propriétaire du compte." },
        { status: 403 }
      );
    }





    const maxPosition = await db.dish.aggregate({
      _max: {
        position: true,
      },
    });
    
    const position = maxPosition._max.position ? maxPosition._max.position + 1 : 1;



    const id = uuidv4();
    const newDish = await db.dish.create({
      data: {
        id,
        name,
        description: description || "",  // Default to empty string if description is not provided
        photo: photo || "uploads/1735415131028bg-food.jpg",  // Default to empty string if photo is not provided
        price,
        state: 'ACTIVE',
        position : position,
        allergenes,  // This is expected to be an array of strings
        categoryId,
        createdAt: new Date(),
      },
    });

    await logMemberActivity(userId, 'dish.create', `A ajouté le plat « ${name} »`);

    return NextResponse.json(newDish, { status: 201 });
  } catch (error) {
    console.error("Error creating dish:", error);
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

      const { id, name, description, photo,  state,
        position, price } = await req.json();
  
      // Validate required field
      if (!id) {
        return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
      }

      // Workspace ownership: the dish must belong to the caller's owner
      // (via its category → menu → restaurant). Blocks cross-workspace edits.
      const ownedDish = await db.dish.findFirst({
        where: { id, category: { menu: { restaurant: { userId: ownerId } } } },
        select: { id: true },
      });
      if (!ownedDish) {
        return NextResponse.json({ error: "Plat introuvable" }, { status: 404 });
      }
  
      // Only update fields that were actually provided. Crucially, `state` is
      // never defaulted to 'ACTIVE': the edit modal PUT ({id,name,description,
      // price[,photo]}) omits state and must NOT re-activate a deactivated dish,
      // while the toggle PUT ({id,state}) changes only state.
      const data: Prisma.DishUpdateInput = { updatedAt: new Date() };

      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;
      if (photo !== undefined) data.photo = photo;
      if (price !== undefined) data.price = price;
      if (position !== undefined) data.position = position;
      if (state !== undefined) data.state = state;

      const updatedDish = await db.dish.update({
        where: { id },
        data,
      });

      await logMemberActivity(
        userId,
        'dish.update',
        `A modifié le plat « ${updatedDish.name} »`
      );

      return NextResponse.json(updatedDish, { status: 200 });
    } catch (error) {
      console.error("Error updating dish:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ error: "Dish not found" }, { status: 404 });
      }
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
      const blocked = await blockIfTrialExpired(userId);
      if (blocked) return blocked;
      const ownerId = await getWorkspaceOwnerId(userId);

      const { id, ids } = await req.json();
  
      // Validate required field
      if (!id && !ids) {
        return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
      }

      const targetIds: string[] = Array.isArray(ids) ? ids : id ? [id] : [];

      // Scope the delete to dishes within the caller's workspace only.
      const del = await db.dish.deleteMany({
        where: {
          id: { in: targetIds },
          category: { menu: { restaurant: { userId: ownerId } } },
        },
      });

      if (del.count > 0) {
        await logMemberActivity(
          userId,
          'dish.delete',
          del.count > 1
            ? `A supprimé ${del.count} plats`
            : 'A supprimé un plat'
        );
      }

      return NextResponse.json({ message: "Dish deleted successfully" }, { status: 200 });
    } catch (error) {
      console.error("Error deleting dish:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ error: "Dish not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }

// Get a specific Offer by ID (optional)



// Get all Dishes for the caller's workspace owner
export async function GET() {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Resolve the workspace owner so a member sees the OWNER's dishes and no
    // cross-workspace dishes leak out.
    const ownerId = await getWorkspaceOwnerId(userId);

    const dishes = await db.dish.findMany({
      where: {
        category: { menu: { restaurant: { userId: ownerId } } },
      },
      include: {
        category: true, // Optionally include related categories if needed
      },
    });

console.log("GET at api/plat gave this", dishes)

    return NextResponse.json(dishes, { status: 200 });
  } catch (error) {
    console.error("Error fetching dishes:", error);
    return NextResponse.json({ error: "Failed to fetch dishes" }, { status: 500 });
  }
}
