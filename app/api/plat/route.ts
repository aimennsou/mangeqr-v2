
import { NextRequest , NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Prisma, PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, description, photo, price, 
     categoryId, allergenes } = await req.json();
    
    // Validate required fields
    if (!name || !price || !categoryId || !allergenes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }





    const maxPosition = await prisma.dish.aggregate({
      _max: {
        position: true,
      },
    });
    
    const position = maxPosition._max.position ? maxPosition._max.position + 1 : 1;



    const id = uuidv4();
    const newDish = await prisma.dish.create({
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

    return NextResponse.json(newDish, { status: 201 });
  } catch (error) {
    console.error("Error creating dish:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Update an Offer
export async function PUT(req: NextRequest) {
    try {
      const { id, name, description, photo,  state,
        position, price } = await req.json();
  
      // Validate required field
      if (!id) {
        return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
      }
  
      const updatedDish = await prisma.dish.update({
        where: { id },
        data: {
          name,
          description,
          photo,
          price,
          state: state || 'ACTIVE',
          position,
          updatedAt: new Date(),
        },
      });
  
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
      const { id } = await req.json();
  
      // Validate required field
      if (!id) {
        return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
      }
  
      await prisma.dish.delete({
        where: { id },
      });
  
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



// Get all Categories for the authenticated user's shops
// Get all Dishes
export async function GET(req: NextRequest) {
  try {
    // Fetch all dishes without any filter
    const dishes = await prisma.dish.findMany({
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
