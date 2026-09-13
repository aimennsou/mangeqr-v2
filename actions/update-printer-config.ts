'use server';

import * as z from 'zod';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { PrinterConfigSchema } from '@/schemas';
import { currentUser } from '@/lib/authentication';
import { assertRestaurantOwner } from '@/data/restaurant';
import { isWorkspaceMember } from '@/data/workspace';

/**
 * Update the ticket-printer configuration for a restaurant (FEAT-1 follow-up).
 *
 * Mirrors `updateMenuAppearance`: owner-scoped (members cannot change it), the
 * user must own the target restaurant, input is validated with
 * `PrinterConfigSchema`, and the result is persisted to
 * `Restaurant.printerConfig` (JSON) via the shared Prisma client.
 */
export async function updatePrinterConfig(
  restaurantId: string,
  values: z.infer<typeof PrinterConfigSchema>
) {
  const user = await currentUser();

  if (!user?.id) {
    return { error: 'Unauthorized.' };
  }

  // Owner-only: members cannot change the printer configuration.
  if (await isWorkspaceMember(user.id)) {
    return { error: 'Action réservée au propriétaire du compte.' };
  }

  // Owner-scoping: reject when the restaurant is not owned by the user.
  const restaurant = await assertRestaurantOwner(user.id, restaurantId);

  if (!restaurant) {
    return { error: 'Restaurant introuvable.' };
  }

  const validated = PrinterConfigSchema.safeParse(values);

  if (!validated.success) {
    return { error: 'Configuration invalide.' };
  }

  await db.restaurant.update({
    where: { id: restaurant.id },
    data: {
      printerConfig: validated.data as Prisma.InputJsonValue
    }
  });

  return { success: 'Configuration enregistrée.' };
}
