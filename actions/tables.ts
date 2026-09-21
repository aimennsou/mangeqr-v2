'use server';

import * as z from 'zod';

import { db } from '@/lib/db';
import { SaveFloorPlanSchema } from '@/schemas';
import { currentUserId } from '@/lib/authentication';
import { getWorkspaceContext } from '@/data/workspace';
import { hasPermission } from '@/lib/permissions';
import { assertRestaurantOwned } from '@/data/tables';

type ActionResult =
  | { error: string; success?: undefined }
  | { success: string; error?: undefined };

/**
 * Save a restaurant's floor plan (zones + tables) in one atomic transaction —
 * FEAT-2. Owner-only (members can act on menus/dishes but not restaurant
 * structure, mirroring the restaurant mutation guards). The whole plan is
 * replaced: zones/tables absent from the payload are deleted, present ones are
 * upserted, and table→zone links are validated to belong to the same
 * restaurant. Table labels must be unique within the restaurant.
 */
export async function saveFloorPlan(
  values: z.infer<typeof SaveFloorPlanSchema>
): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) {
    return { error: 'Non autorisé.' };
  }

  const { ownerId, role, permissions } = await getWorkspaceContext(userId);
  // #7: members need the "tables" permission to edit the floor plan.
  if (role === 'MEMBER' && !hasPermission(permissions, 'tables')) {
    return { error: "Vous n'avez pas la permission de gérer le plan de salle." };
  }

  const parsed = SaveFloorPlanSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Données de plan invalides.' };
  }

  const { restaurantId, zones, tables } = parsed.data;

  // Scope to the workspace owner's restaurant.
  const owned = await assertRestaurantOwned(restaurantId, ownerId);
  if (!owned) {
    return { error: 'Restaurant introuvable.' };
  }

  // Guard: table labels must be unique within the restaurant.
  const labels = tables.map((t) => t.label.trim().toLowerCase());
  if (new Set(labels).size !== labels.length) {
    return { error: 'Les numéros/noms de table doivent être uniques.' };
  }

  // Guard: every table's zoneId (if set) must reference a zone in this payload.
  const zoneIds = new Set(zones.map((zAdd) => zAdd.id));
  for (const t of tables) {
    if (t.zoneId && !zoneIds.has(t.zoneId)) {
      return { error: 'Une table référence une zone inexistante.' };
    }
  }

  try {
    await db.$transaction(async (tx) => {
      const keepZoneIds = zones.map((zAdd) => zAdd.id);
      const keepTableIds = tables.map((t) => t.id);

      // Delete tables removed from the plan (scoped to this restaurant).
      await tx.restaurantTable.deleteMany({
        where: {
          restaurantId,
          id: keepTableIds.length ? { notIn: keepTableIds } : undefined
        }
      });
      // Delete zones removed from the plan.
      await tx.tableZone.deleteMany({
        where: {
          restaurantId,
          id: keepZoneIds.length ? { notIn: keepZoneIds } : undefined
        }
      });

      // Upsert zones first (tables may reference them).
      for (const zoneItem of zones) {
        await tx.tableZone.upsert({
          where: { id: zoneItem.id },
          create: {
            id: zoneItem.id,
            restaurantId,
            name: zoneItem.name.trim(),
            position: zoneItem.position ?? 0
          },
          update: {
            name: zoneItem.name.trim(),
            position: zoneItem.position ?? 0
          }
        });
      }

      // Upsert tables.
      for (const t of tables) {
        await tx.restaurantTable.upsert({
          where: { id: t.id },
          create: {
            id: t.id,
            restaurantId,
            zoneId: t.zoneId ?? null,
            label: t.label.trim(),
            seats: t.seats ?? null,
            posX: t.posX ?? 0,
            posY: t.posY ?? 0
          },
          update: {
            zoneId: t.zoneId ?? null,
            label: t.label.trim(),
            seats: t.seats ?? null,
            posX: t.posX ?? 0,
            posY: t.posY ?? 0
          }
        });
      }
    });
  } catch (error) {
    console.error('Error saving floor plan:', error);
    return { error: "Échec de l'enregistrement du plan de salle." };
  }

  return { success: 'Plan de salle enregistré.' };
}
