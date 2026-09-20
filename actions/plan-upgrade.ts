'use server';

import type { z } from 'zod';

import { db } from '@/lib/db';
import { currentUser } from '@/lib/authentication';
import { getWorkspaceOwnerId } from '@/data/workspace';
import { RequestPlanUpgradeSchema } from '@/schemas';
import { getPlanPriceLabel } from '@/config';
import { createNotification } from '@/lib/notifications';

/**
 * Cash (espèce) plan-upgrade request (#2).
 *
 * Algerian accounts (a restaurant with currency DINAR) pay offline, so there is
 * no Stripe checkout: the owner submits a REQUEST that the back-office follows
 * up on (calls them, takes payment, grants the plan). Every SUPERADMIN is
 * notified so they can act on it.
 *
 * Owner-scoped: the request is recorded against the workspace OWNER (members act
 * on the owner's account).
 */
export async function requestPlanUpgrade(
  values: z.infer<typeof RequestPlanUpgradeSchema>,
): Promise<{ error?: string; success?: string }> {
  const user = await currentUser();
  if (!user?.id) return { error: 'Non autorisé.' };

  const parsed = RequestPlanUpgradeSchema.safeParse(values);
  if (!parsed.success) return { error: 'Données invalides.' };

  const { targetPlan, frequency, contactPhone, note } = parsed.data;
  const ownerId = await getWorkspaceOwnerId(user.id);

  try {
    const priceLabel = getPlanPriceLabel(targetPlan, frequency, 'DINAR');

    const request = await db.planUpgradeRequest.create({
      data: {
        userId: ownerId,
        targetPlan,
        frequency,
        priceLabel,
        currency: 'DINAR',
        contactPhone: contactPhone || null,
        note: note || null,
      },
      select: { id: true },
    });

    // Notify the back-office so they can call the user.
    const owner = await db.user.findUnique({
      where: { id: ownerId },
      select: { name: true, email: true },
    });
    const who = owner?.name ?? owner?.email ?? 'Un compte';
    const admins = await db.user.findMany({
      where: { role: 'SUPERADMIN' },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) =>
        createNotification({
          userId: a.id,
          type: 'ORDER_STATUS',
          title: 'Demande de mise à niveau (espèces)',
          body: `${who} souhaite passer au forfait ${targetPlan} (${priceLabel}).`,
          link: '/superadmin/upgrades',
          entityId: request.id,
        }),
      ),
    );

    return {
      success:
        'Demande envoyée. Notre équipe vous contactera pour finaliser votre forfait.',
    };
  } catch {
    return { error: "Impossible d'envoyer la demande." };
  }
}
