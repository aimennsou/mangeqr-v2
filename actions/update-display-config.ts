'use server';

import * as z from 'zod';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { TvConfigSchema, BorneConfigSchema } from '@/schemas';
import { currentUser } from '@/lib/authentication';
import { assertRestaurantOwner } from '@/data/restaurant';
import { isWorkspaceMember } from '@/data/workspace';

/**
 * Owner-only actions to edit the public display views:
 *  - TV menu board (/tv/[id])   → Restaurant.tvConfig
 *  - Self-order kiosk (/borne/[id]) → Restaurant.borneConfig
 *
 * Mirrors updatePrinterConfig: owner-scoped (members rejected), the user must
 * own the target restaurant, input validated, persisted as JSON.
 */

async function guard(restaurantId: string) {
  const user = await currentUser();
  if (!user?.id) return { error: 'Unauthorized.' as const };
  if (await isWorkspaceMember(user.id)) {
    return { error: 'Action réservée au propriétaire du compte.' as const };
  }
  const restaurant = await assertRestaurantOwner(user.id, restaurantId);
  if (!restaurant) return { error: 'Restaurant introuvable.' as const };
  return { restaurant };
}

export async function updateTvConfig(
  restaurantId: string,
  values: z.infer<typeof TvConfigSchema>
) {
  const g = await guard(restaurantId);
  if ('error' in g) return { error: g.error };

  const validated = TvConfigSchema.safeParse(values);
  if (!validated.success) return { error: 'Configuration invalide.' };

  await db.restaurant.update({
    where: { id: g.restaurant.id },
    data: { tvConfig: validated.data as Prisma.InputJsonValue },
  });

  return { success: 'Affichage TV enregistré.' };
}

export async function updateBorneConfig(
  restaurantId: string,
  values: z.infer<typeof BorneConfigSchema>
) {
  const g = await guard(restaurantId);
  if ('error' in g) return { error: g.error };

  const validated = BorneConfigSchema.safeParse(values);
  if (!validated.success) return { error: 'Configuration invalide.' };

  await db.restaurant.update({
    where: { id: g.restaurant.id },
    data: { borneConfig: validated.data as Prisma.InputJsonValue },
  });

  return { success: 'Affichage borne enregistré.' };
}
