import { NextRequest, NextResponse } from 'next/server';
import {  PrismaClient } from '@prisma/client';;

export async function POST(req: NextRequest) {
  try {
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

    // Update each menu position in a transaction
    await prisma.$transaction(
      updatedMenus.map((menu) =>
        prisma.menu.update({
          where: { id: menu.menuId },
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
