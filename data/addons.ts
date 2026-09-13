import { db } from '@/lib/db';

/**
 * Dish add-on data layer (server-only reads) — FEAT-1/D12.
 *
 * Add-on groups + options are owner-defined per dish and drive the diner
 * ordering flow. Reads are scoped to the workspace OWNER via the dish's
 * category → menu → restaurant chain. Never import into a client component.
 */

export interface AddonOption {
  id: string;
  name: string;
  priceDelta: number;
  position: number;
}

export interface AddonGroup {
  id: string;
  name: string;
  type: 'SINGLE' | 'MULTI';
  required: boolean;
  position: number;
  options: AddonOption[];
}

/**
 * Resolve the workspace owner that a dish belongs to (dish → category → menu →
 * restaurant.userId). Returns the owner id or null if the dish can't be traced.
 * Used to scope add-on mutations to the caller's workspace.
 */
export async function getDishOwnerId(dishId: string): Promise<string | null> {
  try {
    const dish = await db.dish.findUnique({
      where: { id: dishId },
      select: {
        category: {
          select: { menu: { select: { restaurant: { select: { userId: true } } } } }
        }
      }
    });
    return dish?.category?.menu?.restaurant?.userId ?? null;
  } catch {
    return null;
  }
}

/** Load a dish's add-on groups (with options), ordered by position. */
export async function getDishAddonGroups(
  dishId: string
): Promise<AddonGroup[]> {
  try {
    const groups = await db.dishAddonGroup.findMany({
      where: { dishId },
      orderBy: { position: 'asc' },
      include: { options: { orderBy: { position: 'asc' } } }
    });
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      required: g.required,
      position: g.position,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        priceDelta: o.priceDelta,
        position: o.position
      }))
    }));
  } catch {
    return [];
  }
}
