import { PrismaClient } from '@prisma/client';

import { v4 as uuidv4 } from 'uuid';
import { NextRequest , NextResponse } from 'next/server';


const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const {  client, review, shopId ,message,state} = await req.json();
    
    // Validate request data
    if (!review  || !shopId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = uuidv4();
    console.log('Generated UUID:', id);
    const newnewsletter = await prisma.review.create({
      data: {
       id:id,
       client,
       review,
       message,
       state: state || 'MANGEQR',
       shopId,
        
        createdAt: new Date(),
   
      },
    });

    console.log(newnewsletter)
    return NextResponse.json(newnewsletter, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}



export async function GET() {
    try {
      // Step 1: Get the authenticated user's ID
      const { userId } = await auth();
  
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      // Step 2: Find the user in the database and include their shops
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          shops: true,
        },
      });
  
      if (!user || !user.shops || user.shops.length === 0) {
        return NextResponse.json({ error: "No shops found for this user" }, { status: 404 });
      }
  
      // Step 3: Extract all the shop IDs
      const shopIds = user.shops.map((shop) => shop.id);
  
      // Step 4: Fetch all reviews associated with these shop IDs, including the related shop and client details
      const reviews = await prisma.review.findMany({
        where: {
          shopId: {
            in: shopIds,
          },
        },
        include: {
            shop: true,
          },
      });
  
      console.log("Reviews:", reviews);
  
      // Step 5: Return the reviews (including shop and client details) as the response
      return NextResponse.json(reviews, { status: 200 });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
  }
  
