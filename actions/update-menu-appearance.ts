'use server';

import * as z from 'zod';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { MenuAppearanceSchema } from '@/schemas';
import { currentUser } from '@/lib/authentication';
import { assertRestaurantOwner } from '@/data/restaurant';
import { isWorkspaceMember } from '@/data/workspace';

/**
 * Update the diner-menu appearance settings for a restaurant (Requirement 4).
 *
 * Owner-scoped: the authenticated user must own the target restaurant, or the
 * update is rejected. Input is validated with `MenuAppearanceSchema` and
 * persisted to `Restaurant.menuAppearance` via the shared Prisma client.
 */
export async function updateMenuAppearance(
  restaurantId: string,
  values: z.infer<typeof MenuAppearanceSchema>
) {
  const user = await currentUser();

  if (!user?.id) {
    return { error: 'Unauthorized.' };
  }

  // Owner-only: members cannot change the diner-menu appearance.
  if (await isWorkspaceMember(user.id)) {
    return { error: 'Action réservée au propriétaire du compte.' };
  }

  // Owner-scoping: reject when the restaurant is not owned by the user.
  const restaurant = await assertRestaurantOwner(user.id, restaurantId);

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
