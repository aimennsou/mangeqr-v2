'use server';

import * as z from 'zod';

import { db } from '@/lib/db';
import { SaveDishAddonsSchema } from '@/schemas';
import { currentUserId } from '@/lib/authentication';
import { getWorkspaceContext } from '@/data/workspace';
import { getDishOwnerId } from '@/data/addons';

type ActionResult =
  | { error: string; success?: undefined }
  | { success: string; error?: undefined };

/**
 * Save a dish's add-on groups + options (FEAT-1/D12). Owner-only (members act
 * on menus/dishes, but add-on structure is treated as a menu-config action
 * scoped to the workspace owner). The whole add-on set is replaced atomically:
 * groups/options absent from the payload are deleted; present ones are upserted
 * with their positions.
 */
export async function saveDishAddons(
  values: z.infer<typeof SaveDishAddonsSchema>
): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) {
    return { error: 'Non autorisé.' };
  }

  const parsed = SaveDishAddonsSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Données de suppléments invalides.' };
  }

  const { dishId, groups } = parsed.data;

  // Scope to the workspace owner: the dish must belong to the caller's owner.
  const { ownerId } = await getWorkspaceContext(userId);
  const dishOwnerId = await getDishOwnerId(dishId);
  if (!dishOwnerId || dishOwnerId !== ownerId) {
    return { error: 'Plat introuvable.' };
  }

  // Guard: SINGLE + required groups must have at least one option (already
  // enforced by schema min(1)); MULTI groups can't be "required" in v1.
  for (const g of groups) {
    if (g.type === 'MULTI' && g.required) {
      return {
        error: 'Un groupe à choix multiple ne peut pas être obligatoire.'
      };
    }
  }

  try {
    await db.$transaction(async (tx) => {
      const keepGroupIds = groups.map((g) => g.id);

      // Delete groups removed from the payload (cascades their options).
      await tx.dishAddonGroup.deleteMany({
        where: {
          dishId,
          id: keepGroupIds.length ? { notIn: keepGroupIds } : undefined
        }
      });

      for (const g of groups) {
        await tx.dishAddonGroup.upsert({
          where: { id: g.id },
          create: {
            id: g.id,
            dishId,
            name: g.name.trim(),
            type: g.type,
            required: g.type === 'SINGLE' ? g.required : false,
            position: g.position ?? 0
          },
          update: {
            name: g.name.trim(),
            type: g.type,
            required: g.type === 'SINGLE' ? g.required : false,
            position: g.position ?? 0
          }
        });

        // Replace this group's options (delete-then-upsert kept simple).
        const keepOptionIds = g.options.map((o) => o.id);
        await tx.dishAddonOption.deleteMany({
          where: {
            groupId: g.id,
            id: keepOptionIds.length ? { notIn: keepOptionIds } : undefined
          }
        });
        for (const o of g.options) {
          await tx.dishAddonOption.upsert({
            where: { id: o.id },
            create: {
              id: o.id,
              groupId: g.id,
              name: o.name.trim(),
              priceDelta: o.priceDelta ?? 0,
              position: o.position ?? 0
            },
            update: {
              name: o.name.trim(),
              priceDelta: o.priceDelta ?? 0,
              position: o.position ?? 0
            }
          });
        }
      }
    });
  } catch (error) {
    console.error('Error saving dish addons:', error);
    return { error: "Échec de l'enregistrement des suppléments." };
  }

  return { success: 'Suppléments enregistrés.' };
}
