'use server';

import type { z } from 'zod';

import { db } from '@/lib/db';
import { currentUser } from '@/lib/authentication';
import { DevisRequestSchema } from '@/schemas';
import { createNotification } from '@/lib/notifications';

/**
 * Public "demande de devis" (#4) for hardware add-ons — self-order kiosks
 * (bornes) and/or TV menu-boards. Submitted from the landing "Kit restaurateur"
 * dialog. Anyone can submit (logged-in or not); when a user is authenticated we
 * link the request to their account. Every SUPERADMIN is notified so the
 * back-office can follow up.
 */
export async function requestDevis(
  values: z.infer<typeof DevisRequestSchema>,
): Promise<{ error?: string; success?: string }> {
  const parsed = DevisRequestSchema.safeParse(values);
  if (!parsed.success) return { error: 'Données invalides.' };

  const {
    kind,
    name,
    phone,
    email,
    restaurantName,
    restaurantCount,
    borneCount,
    tvCount,
    teamType,
    message,
  } = parsed.data;

  // Link to the requesting account when signed in (optional).
  const user = await currentUser();
  const userId = user?.id ?? null;

  try {
    const request = await db.devisRequest.create({
      data: {
        userId,
        kind,
        name,
        phone,
        email: email || null,
        restaurantName: restaurantName || null,
        restaurantCount: restaurantCount ?? null,
        borneCount: borneCount ?? null,
        tvCount: tvCount ?? null,
        teamType: teamType || null,
        message: message || null,
      },
      select: { id: true },
    });

    // Notify the back-office so they can call the prospect.
    const kindLabel =
      kind === 'BORNE'
        ? 'Bornes'
        : kind === 'TV'
          ? 'Affichage TV'
          : 'Bornes + TV';
    const admins = await db.user.findMany({
      where: { role: 'SUPERADMIN' },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) =>
        createNotification({
          userId: a.id,
          type: 'ORDER_STATUS',
          title: 'Nouvelle demande de devis',
          body: `${name} (${phone}) — ${kindLabel}.`,
          link: '/superadmin/devis',
          entityId: request.id,
        }),
      ),
    );

    return {
      success:
        'Demande envoyée. Notre équipe vous contactera rapidement pour votre devis.',
    };
  } catch {
    return { error: "Impossible d'envoyer la demande." };
  }
}
