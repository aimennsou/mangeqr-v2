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

    const updatedMenus = await req.json();

    console.log("Received data at /api/menu/position:", updatedMenus);

    if (!Array.isArray(updatedMenus)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Validate that each menu object has the required properties
    for (const menu of updatedMenus) {
      if (typeof menu.menuId !== 'string' || typeof menu.position !== 'number') {
        return NextResponse.json({ error: "Invalid menu data" }, { status: 400 });
      }
    }

    // Only update menus that belong to the caller's workspace owner. Scoping the
    // updateMany `where` by restaurant.userId makes cross-workspace writes no-ops.
    await db.$transaction(
      updatedMenus.map((menu) =>
        db.menu.updateMany({
          where: { id: menu.menuId, restaurant: { userId: ownerId } },
          data: { position: menu.position },
        })
      )
    );

    return NextResponse.json({ message: "Positions updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating menu positions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
