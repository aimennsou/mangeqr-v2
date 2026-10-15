import { NextRequest, NextResponse } from 'next/server';

import { currentUserId } from '@/lib/authentication';
import { db } from '@/lib/db';
import { isWorkspaceMember } from '@/data/workspace';
import { sendMail, isEmailConfigured } from '@/lib/email';

// Send a MarketingCampaign to all its recipients
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

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Load the campaign and verify ownership through its restaurant
    const campaign = await db.marketingCampaign.findFirst({
      where: { id, restaurant: { userId } },
      include: { emailRecipients: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or not owned by user' },
        { status: 404 }
      );
    }

    if (campaign.sent) {
      return NextResponse.json(
        { message: 'Cette campagne a déjà été envoyée.' },
        { status: 200 }
      );
    }

    if (campaign.emailRecipients.length === 0) {
      return NextResponse.json(
        { error: 'Cette campagne ne contient aucun destinataire.' },
        { status: 400 }
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          error:
            "Le service d'envoi d'emails n'est pas configuré (RESEND_API_KEY manquante).",
        },
        { status: 500 }
      );
    }

    // sendMail returns a boolean per recipient (it inspects Resend's error
    // body), so the count below reflects messages Resend actually accepted —
    // not merely calls that didn't throw.
    const results = await Promise.all(
      campaign.emailRecipients.map((recipient) =>
        sendMail({
          from: 'marketing',
          to: recipient.email,
          subject: campaign.subject,
          html: campaign.body,
        })
      )
    );

    const sentCount = results.filter(Boolean).length;

    // Mark the campaign as sent
    await db.marketingCampaign.update({
      where: { id: campaign.id },
      data: { sent: true, sentAt: new Date() },
    });

    return NextResponse.json({ sent: sentCount }, { status: 200 });
  } catch (error) {
    console.error('Error sending MarketingCampaign:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
