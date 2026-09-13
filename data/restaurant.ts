import { db } from '@/lib/db';

import type { MenuAppearance } from '@/schemas';

/**
 * Fetch all restaurants owned by a given user.
 */
export async function getRestaurantsForUser(userId: string) {
  return db.restaurant.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Fetch a single restaurant by its id (no ownership check).
 * Used by both the owner editor and the public diner-facing view.
 */
export async function getRestaurantById(id: string) {
  return db.restaurant.findUnique({
    where: { id },
  });
}

/**
 * Verify that a restaurant belongs to the given user.
 * Returns the restaurant when the user owns it, otherwise null.
 */
export async function assertRestaurantOwner(userId: string, restaurantId: string) {
  return db.restaurant.findFirst({
    where: { id: restaurantId, userId },
  });
}

/**
 * Return the set of restaurant ids owned by a user.
 * Convenience for routes that aggregate across all of a user's restaurants.
 */
export async function getRestaurantIdsForUser(userId: string): Promise<string[]> {
  const restaurants = await db.restaurant.findMany({
    where: { userId },
    select: { id: true },
  });

  return restaurants.map((restaurant) => restaurant.id);
}

/**
 * Read the diner-menu appearance settings for a restaurant, owner-scoped.
 *
 * Returns the stored `menuAppearance` (or `null` when the owner has not
 * customized it yet, so callers fall back to the default appearance).
 * Returns `null` as well when the restaurant does not exist or is not owned
 * by the given user — the caller cannot distinguish "unset" from "not yours",
 * which keeps another user's restaurants opaque.
 */
export async function getMenuAppearanceForUser(
  userId: string,
  restaurantId: string
): Promise<MenuAppearance | null> {
  const restaurant = await db.restaurant.findFirst({
    where: { id: restaurantId, userId },
    select: { menuAppearance: true },
  });

  if (!restaurant || restaurant.menuAppearance == null) {
    return null;
  }

  return restaurant.menuAppearance as MenuAppearance;
}
