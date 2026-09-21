'use server';

import * as z from 'zod';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { TvConfigSchema, BorneConfigSchema } from '@/schemas';
import { currentUser } from '@/lib/authentication';
import { assertRestaurantOwner } from '@/data/restaurant';
import { getWorkspaceContext } from '@/data/workspace';
import { hasPermission } from '@/lib/permissions';

/**
 * Actions to edit the public display views:
 *  - TV menu board (/tv/[id])   → Restaurant.tvConfig
 *  - Self-order kiosk (/borne/[id]) → Restaurant.borneConfig
 *
 * Scoped to the workspace OWNER's restaurant. Members need the "numerique"
 * permission (#7); input validated, persisted as JSON.
 */

async function guard(restaurantId: string) {
  const user = await currentUser();
  if (!user?.id) return { error: 'Unauthorized.' as const };
  const { ownerId, role, permissions } = await getWorkspaceContext(user.id);
  if (role === 'MEMBER' && !hasPermission(permissions, 'numerique')) {
    return {
      error: "Vous n'avez pas la permission de gérer le menu numérique." as const,
    };
  }
  const restaurant = await assertRestaurantOwner(ownerId, restaurantId);
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
