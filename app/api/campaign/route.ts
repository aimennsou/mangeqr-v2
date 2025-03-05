
import {  PrismaClient } from '@prisma/client';;
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

// Create a MarketingCampaign
export async function POST(req: NextRequest) {
  try {
    const { name, description, emailList, subject, body, shopId } = await req.json();

    // Validate required fields
    if (!name || !subject || !body || !shopId || !Array.isArray(emailList)) {
      return NextResponse.json(
        { error: "Missing required fields: name, subject, body, emailList (array), or shopId" },
        { status: 400 }
      );
    }

    // Validate the shop
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { user: true },
    });

    if (!shop || !shop.user) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const user = shop.user;
    const campaignLimit = user.plan === "Pro" ? 4 : user.plan === "Premium" ? 6 : Infinity;

    // Count user's campaigns
    const campaignCount = await prisma.marketingCampaign.count({
      where: { shop: { userId: user.id } },
    });

    if (campaignCount >= campaignLimit) {
      return NextResponse.json(
        { error: `Campaign limit reached. Your plan allows up to ${campaignLimit} campaigns.` },
        { status: 400 }
      );
    }

    // Create a new MarketingCampaign
    const newCampaign = await prisma.marketingCampaign.create({
      data: {
        id: uuidv4(),
        name,
        description,
        emailList,
        subject,
        body,
        shopId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error('Error creating MarketingCampaign:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Update a MarketingCampaign
export async function PUT(req: NextRequest) {
  try {
    const { id, name, description, emailList, subject, body, shopId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const dataToUpdate: any = { updatedAt: new Date() };

    if (name) dataToUpdate.name = name;
    if (description) dataToUpdate.description = description;
    if (emailList && Array.isArray(emailList)) dataToUpdate.emailList = emailList;
    if (subject) dataToUpdate.subject = subject;
    if (body) dataToUpdate.body = body;
    if (shopId) dataToUpdate.shopId = shopId;

    if (Object.keys(dataToUpdate).length === 1) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedCampaign = await prisma.marketingCampaign.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedCampaign, { status: 200 });
  } catch (error) {
    console.error('Error updating MarketingCampaign:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Delete a MarketingCampaign
export async function DELETE(req: NextRequest) {
  try {
    const { id, ids } = await req.json();

    if (!id && !ids) {
      return NextResponse.json({ error: "Missing required field: id or ids" }, { status: 400 });
    }

    if (ids && Array.isArray(ids)) {
      await prisma.marketingCampaign.deleteMany({
        where: { id: { in: ids } },
      });
    } else if (id) {
      await prisma.marketingCampaign.delete({ where: { id } });
    }

    return NextResponse.json({ message: "Campaign(s) deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error('Error deleting MarketingCampaign:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Get MarketingCampaigns for a User
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { shops: true },
    });

    if (!user || !user.shops || user.shops.length === 0) {
      return NextResponse.json({ error: "No shops found for this user" }, { status: 404 });
    }

    const shopIds = user.shops.map((shop) => shop.id);

    const campaigns = await prisma.marketingCampaign.findMany({
      where: { shopId: { in: shopIds } },
      include: { shop: true },
    });

    return NextResponse.json(campaigns, { status: 200 });
  } catch (error) {
    console.error("Error fetching MarketingCampaigns:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}
