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

    const updatedCategories = await req.json();

    if (!Array.isArray(updatedCategories)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Validate each category object
    for (const category of updatedCategories) {
      if (
        typeof category.categoryId !== 'string' ||
        typeof category.position !== 'number' ||
        typeof category.menuId !== 'string'
      ) {
        return NextResponse.json({ error: "Invalid category data" }, { status: 400 });
      }
    }

    // Resolve which target menuIds actually belong to the caller's workspace,
    // so we never move a category into a menu outside the workspace.
    const targetMenuIds = Array.from(
      new Set(updatedCategories.map((c) => c.menuId as string))
    );
    const ownedMenus = await db.menu.findMany({
      where: { id: { in: targetMenuIds }, restaurant: { userId: ownerId } },
      select: { id: true },
    });
    const ownedMenuIds = new Set(ownedMenus.map((m) => m.id));

    // Only update categories whose SOURCE belongs to the caller's workspace and
    // whose TARGET menu also belongs to it. Scoping the updateMany `where` makes
    // cross-workspace writes no-ops.
    await db.$transaction(
      updatedCategories
        .filter((category) => ownedMenuIds.has(category.menuId as string))
        .map((category) =>
          db.menuCategory.updateMany({
            where: {
              id: category.categoryId,
              menu: { restaurant: { userId: ownerId } },
            },
            data: { position: category.position, menuId: category.menuId },
          })
        )
    );

    return NextResponse.json({ message: "Positions updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating category positions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
