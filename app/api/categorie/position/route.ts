import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const updatedCategories = await req.json();

    console.log("Received data at /api/categorie/position:", updatedCategories);

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

    // Update category positions in a transaction
    await prisma.$transaction(
      updatedCategories.map((category) =>
        prisma.menuCategory.update({
          where: { id: category.categoryId },
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
