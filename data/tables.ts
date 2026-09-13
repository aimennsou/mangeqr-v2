import { db } from '@/lib/db';

/**
 * Table-layout data layer (server-only reads) — FEAT-2.
 *
 * Zones + tables are scoped to a restaurant, which is scoped to the workspace
 * OWNER (mirroring menus/categories). These are plain server reads — never
 * import into a client component. Access control lives in the caller.
 */

export interface TableRow {
  id: string;
  label: string;
  seats: number | null;
  zoneId: string | null;
  posX: number;
  posY: number;
}

export interface ZoneRow {
  id: string;
  name: string;
  position: number;
}

export interface RestaurantFloorPlan {
  zones: ZoneRow[];
  tables: TableRow[];
}

/**
 * Confirm a restaurant belongs to the given workspace owner. Returns the
 * restaurant id when owned, otherwise null. Used to scope every table/zone
 * mutation to the caller's workspace.
 */
export async function assertRestaurantOwned(
  restaurantId: string,
  ownerId: string
): Promise<string | null> {
  try {
    const r = await db.restaurant.findFirst({
      where: { id: restaurantId, userId: ownerId },
      select: { id: true }
    });
    return r?.id ?? null;
  } catch {
    return null;
  }
}

/** Load the full floor plan (zones + tables) for a restaurant. */
export async function getFloorPlan(
  restaurantId: string
): Promise<RestaurantFloorPlan> {
  try {
    const [zones, tables] = await Promise.all([
      db.tableZone.findMany({
        where: { restaurantId },
        orderBy: { position: 'asc' },
        select: { id: true, name: true, position: true }
      }),
      db.restaurantTable.findMany({
        where: { restaurantId },
        orderBy: { label: 'asc' },
        select: {
          id: true,
          label: true,
          seats: true,
          zoneId: true,
          posX: true,
          posY: true
        }
      })
    ]);
    return { zones, tables };
  } catch {
    return { zones: [], tables: [] };
  }
}

/**
 * Diner-facing list of tables for a restaurant (label only), ordered
 * numerically when the labels are numbers, else lexicographically. Used by the
 * public menu's table picker.
 */
export async function listTablesForDiner(
  restaurantId: string
): Promise<{ id: string; label: string }[]> {
  try {
    const tables = await db.restaurantTable.findMany({
      where: { restaurantId },
      select: { id: true, label: true }
    });
    return tables.sort((a, b) => {
      const na = Number(a.label);
      const nb = Number(b.label);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.label.localeCompare(b.label);
    });
  } catch {
    return [];
  }
}
