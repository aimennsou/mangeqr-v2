'use server';

import * as z from 'zod';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { MenuAppearanceSchema } from '@/schemas';
import { currentUser } from '@/lib/authentication';
import { assertRestaurantOwner } from '@/data/restaurant';
import { getWorkspaceContext } from '@/data/workspace';
import { hasPermission } from '@/lib/permissions';

/**
 * Update the diner-menu appearance settings for a restaurant (Requirement 4).
 *
 * Scoped to the workspace OWNER's restaurant. Members need the "numerique"
 * permission (#7). Input is validated with `MenuAppearanceSchema` and persisted
 * to `Restaurant.menuAppearance` via the shared Prisma client.
 */
export async function updateMenuAppearance(
  restaurantId: string,
  values: z.infer<typeof MenuAppearanceSchema>
) {
  const user = await currentUser();

  if (!user?.id) {
    return { error: 'Unauthorized.' };
  }

  const { ownerId, role, permissions } = await getWorkspaceContext(user.id);
  // #7: members need the "numerique" permission to change the menu appearance.
  if (role === 'MEMBER' && !hasPermission(permissions, 'numerique')) {
    return { error: "Vous n'avez pas la permission de gérer le menu numérique." };
  }

  // Owner-scoping: reject when the restaurant is not owned by the workspace.
  const restaurant = await assertRestaurantOwner(ownerId, restaurantId);

  if (!restaurant) {
    return { error: 'Restaurant not found.' };
  }

  const validated = MenuAppearanceSchema.safeParse(values);

  if (!validated.success) {
    return { error: 'Invalid appearance settings.' };
  }

  await db.restaurant.update({
    where: { id: restaurant.id },
    data: {
      menuAppearance: validated.data as Prisma.InputJsonValue
    }
  });

  return { success: 'Appearance updated.' };
}
