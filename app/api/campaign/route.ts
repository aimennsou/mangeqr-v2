import { NextRequest, NextResponse } from 'next/server';

import { currentUserId } from '@/lib/authentication';
import { db } from '@/lib/db';
import { getPlanLimits, getEffectivePlan } from '@/lib/plan';
import { getWorkspaceOwnerId, isWorkspaceMember } from '@/data/workspace';
import { notifyPlanLimitHit } from '@/lib/notifications';

// Create a MarketingCampaign
export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Owner-only: members do not manage marketing.
    if (await isWorkspaceMember(userId)) {
      return NextResponse.json(
        { error: 'Action réservée au propriétaire du compte.' },
        { status: 403 }
      );
    }

    const { name, description, subject, body, restaurantId, recipients } =
      await req.json();

    // Validate required fields
    if (!name || !subject || !body || !restaurantId) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, subject, body, or restaurantId',
        },
        { status: 400 }
      );
    }

    // Verify the restaurant belongs to the current user
    const restaurant = await db.restaurant.findFirst({
      where: { id: restaurantId, userId },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant introuvable' },
        { status: 404 }
      );
    }

    // Enforce the plan's campaign limit (expiry-aware), counted across all of
    // the user's restaurants.
    const user = await db.user.findUnique({ where: { id: userId } });
    const campaignLimit = getPlanLimits(getEffectivePlan(user ?? {})).campaigns;
    const campaignCount = await db.marketingCampaign.count({
      where: { restaurant: { userId } },
    });
    if (campaignCount >= campaignLimit) {
      const ownerId = await getWorkspaceOwnerId(userId);
      await notifyPlanLimitHit({
        ownerId,
        resource: 'campagnes',
        limit: campaignLimit,
      });
      return NextResponse.json(
        {
          error: `Limite de campagnes atteinte. Votre plan permet jusqu'à ${campaignLimit} campagne(s).`,
        },
        { status: 400 }
      );
    }

    // Create the campaign
    const newCampaign = await db.marketingCampaign.create({
      data: {
        name,
        description: description || null,
        subject,
        body,
        restaurantId,
      },
    });

    // Create the recipient rows, if any
    if (Array.isArray(recipients) && recipients.length > 0) {
      await db.emailRecipient.createMany({
        data: recipients
          .filter((email: unknown): email is string => typeof email === 'string')
          .map((email: string) => ({
            campaignId: newCampaign.id,
            email,
          })),
      });
    }

    const campaign = await db.marketingCampaign.findUnique({
      where: { id: newCampaign.id },
      include: { emailRecipients: true },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating MarketingCampaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Get MarketingCampaigns for the workspace owner's restaurants
export async function GET() {
  try {
    const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read access: scope to the workspace owner so a member viewing the page
    // sees the owner's campaigns read-only (mutations are owner-only).
    const ownerId = await getWorkspaceOwnerId(userId);

    const campaigns = await db.marketingCampaign.findMany({
      where: { restaurant: { userId: ownerId } },
      include: {
        restaurant: { select: { id: true, name: true } },
        emailRecipients: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns, { status: 200 });
  } catch (error) {
    console.error('Error fetching MarketingCampaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// Update a MarketingCampaign
export async function PUT(req: NextRequest) {
  try {
    const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Owner-only: members do not manage marketing.
    if (await isWorkspaceMember(userId)) {
      return NextResponse.json(
        { error: 'Action réservée au propriétaire du compte.' },
        { status: 403 }
      );
    }

    const { id, name, description, subject, body, recipients } =
      await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership through the campaign's restaurant
    const existing = await db.marketingCampaign.findFirst({
      where: { id, restaurant: { userId } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Campaign not found or not owned by user' },
        { status: 404 }
      );
    }

    const dataToUpdate: {
      name?: string;
      description?: string | null;
      subject?: string;
      body?: string;
    } = {};

    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description || null;
    if (subject !== undefined) dataToUpdate.subject = subject;
    if (body !== undefined) dataToUpdate.body = body;

    await db.marketingCampaign.update({
      where: { id },
      data: dataToUpdate,
    });

    // Replace recipients if a new list was provided
    if (Array.isArray(recipients)) {
      await db.emailRecipient.deleteMany({ where: { campaignId: id } });

      if (recipients.length > 0) {
        await db.emailRecipient.createMany({
          data: recipients
            .filter(
              (email: unknown): email is string => typeof email === 'string'
            )
            .map((email: string) => ({ campaignId: id, email })),
        });
      }
    }

    const updatedCampaign = await db.marketingCampaign.findUnique({
      where: { id },
      include: { emailRecipients: true },
    });

    return NextResponse.json(updatedCampaign, { status: 200 });
  } catch (error) {
    console.error('Error updating MarketingCampaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Delete a MarketingCampaign (or several)
export async function DELETE(req: NextRequest) {
  try {
    const userId = await currentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Owner-only: members do not manage marketing.
    if (await isWorkspaceMember(userId)) {
      return NextResponse.json(
        { error: 'Action réservée au propriétaire du compte.' },
        { status: 403 }
      );
    }

    const { id, ids } = await req.json();

    if (!id && !ids) {
      return NextResponse.json(
        { error: 'Missing required field: id or ids' },
        { status: 400 }
      );
    }

    const targetIds: string[] = Array.isArray(ids) ? ids : id ? [id] : [];

    if (targetIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: id or ids' },
        { status: 400 }
      );
    }

    // Only delete campaigns owned by the current user.
    // EmailRecipient rows cascade via schema onDelete: Cascade.
    await db.marketingCampaign.deleteMany({
      where: { id: { in: targetIds }, restaurant: { userId } },
    });

    return NextResponse.json(
      { message: 'Campaign(s) deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting MarketingCampaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
