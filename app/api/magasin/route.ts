
import { currentUserId } from '@/lib/authentication';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';


const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const userId = await currentUserId();

  try {
    const { name, address, phone, currency, subdomain, coverPhoto, Wifi, Website, Instagram, Tiktok, Google, Wifistate, Websitestate, Instagramstate, Tiktokstate, Googlestate } = await req.json();

    // Validate request data
    if (!name || !address || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get the authenticated user ID
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    
    const id = uuidv4();
    console.log('Generated UUID:', id);
    const qrUrl = `mangeqr.com/restaurant/${id}`;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Create the new restaurant with updated field names
    const newrestaurant = await prisma.restaurant.create({
      data: {
        id,
        name,
        address,
        phone,
        coverPhoto: coverPhoto || "uploads/1735415131028bg-food.jpg",
        qrUrl,
       
        subdomain,
    
    


      currency,
       
  
        userId: user!.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('Created restaurant:', newrestaurant);
    return NextResponse.json(newrestaurant, { status: 201 });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


export async function GET() {
  try {
    // Get the authenticated user's ID
    const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the user based on the clerkId

    // Fetch all restaurants associated with the user
    const restaurants = await prisma.restaurant.findMany({
      where: {
        userId: userId,  // Access user.id only after confirming user exists
      }
    });

    // Handle the case where no restaurants exist
    if (restaurants.length === 0) {
      return NextResponse.json({ message: "No restaurants found for this user" }, { status: 404 });
    }

    return NextResponse.json(restaurants, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


  export async function DELETE(req: NextRequest) {
    try {
      // Parse and log the request body
      const body = await req.json();
      console.log("Received request body:", body);
  
      const { id } = body;
  
      // Validate that the id field is provided
      if (!id) {
        console.error("Missing 'id' in request body");
        return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
      }
  
      // Handle deletion when id is an array of IDs
      if (Array.isArray(id)) {
        await prisma.restaurant.deleteMany({
          where: {
            id: {
              in: id,
            },
          },
        });
      } 
      // Handle deletion when id is a single ID
      else {
        await prisma.restaurant.delete({
          where: { id },
        });
      }
  
      return NextResponse.json({ message: "Offer(s) deleted successfully" }, { status: 200 });
    } catch (error: any) {
      console.error('Error deleting offer(s):', error);
  
      // Handle specific Prisma error for not found
      if (error === 'P2025') {
        return NextResponse.json({ error: "Offer(s) not found" }, { status: 404 });
      }
  
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }



  export async function PUT(req: NextRequest) {
    try {
      const { id, name, address, phone,currency, subdomain, coverPhoto, Wifi, Website, Instagram, Tiktok, Google, Wifistate, Websitestate, Instagramstate, Tiktokstate, Googlestate } = await req.json();
  
      // Validate request data
      if (!id || !name || !address || !phone  || !currency ) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
  
      // Update the restaurant record in the database with updated field names
      const updatedrestaurant = await prisma.restaurant.update({
        where: { id },
        data: {
          name,
          address,
          phone,
          coverPhoto,
         
       
        
      
  
          currency,
          subdomain,
      
        
  
        
    
          updatedAt: new Date(),
        },
      });
  
      console.log(updatedrestaurant);
      return NextResponse.json(updatedrestaurant, { status: 200 });
    } catch (error) {
      console.error('Error updating restaurant:', error);
      if (error) {
        return NextResponse.json({ error: "restaurant not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
  
  
