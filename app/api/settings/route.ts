
import { auth } from '@clerk/nextjs';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { v4 as uuidv4 } from 'uuid';
const prisma = new PrismaClient();







export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json(); // Extract the ID from the request body

    // Validate the ID
    if (!id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the shop associated with the ID
    const shop = await prisma.shop.findUnique({
      where: {
        id: id, // Ensure the ID matches the field in your database
      },
    });

    // Handle the case where the shop is not found
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json(shop, { status: 200 });
  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 });
  }
}



  export async function PUT(req: NextRequest) {
    try {
      const { id, Wifistate, Websitestate, Instagramstate, Tiktokstate, Googlestate } = await req.json();
  
      // Validate required fields
      if (!id) {
        return NextResponse.json({ error: "Missing shop ID" }, { status: 400 });
      }
  
      // Update the settings in the shop record
      const updatedSettings = await prisma.shop.update({
        where: { id },
        data: {
          Wifistate,
          Websitestate,
          Instagramstate,
          Tiktokstate,
          Googlestate,
          updatedAt: new Date(),
        },
      });
  
      console.log('Updated Settings:', updatedSettings);
      return NextResponse.json(updatedSettings, { status: 200 });
    } catch (error) {
      console.error('Error updating shop:', error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
  
  
  