'use server';

import * as z from 'zod';

import { db } from '@/lib/db';
import { DesignOrderSchema } from '@/schemas';
import { currentUserId } from '@/lib/authentication';
import { getWorkspaceOwnerId } from '@/data/workspace';
import { getDesignProduct, getDeliveryOptions } from '@/config';

/**
 * Create a physical QR-code design order (Menu numérique → "Commander un
 * design").
 *
 * Workspace-scoped: the caller is resolved to their workspace OWNER, and the
 * target restaurant must belong to that owner — mirroring how menu/categorie
 * writes are scoped. Input is validated with `DesignOrderSchema`; the design
 * label is denormalized from the config catalog at order time.
 *
 * Returns `{ error }` on failure or `{ success }` on success, matching the
 * project's server-action convention.
 */
export async function createDesignOrder(
  values: z.infer<typeof DesignOrderSchema>
) {
  const userId = await currentUserId();
  if (!userId) {
    return { error: 'Non autorisé.' };
  }

  const validated = DesignOrderSchema.safeParse(values);
  if (!validated.success) {
    return { error: 'Informations de commande invalides.' };
  }

  const {
    restaurantId,
    designId,
    quantity,
    contactName,
    contactEmail,
    contactPhone,
    deliveryMethod,
    notes
  } = validated.data;

  // The design must exist in the catalog.
  const product = getDesignProduct(designId);
  if (!product) {
    return { error: 'Design introuvable.' };
  }

  // Workspace scoping: the target restaurant must belong to the caller's owner.
  const ownerId = await getWorkspaceOwnerId(userId);
  const ownedRestaurant = await db.restaurant.findFirst({
    where: { id: restaurantId, userId: ownerId },
    select: { id: true, currency: true }
  });
  if (!ownedRestaurant) {
    return { error: 'Restaurant introuvable.' };
  }

  // Defense in depth: the delivery method must be one of the options allowed
  // for this restaurant's country (currency-derived). This enforces the
  // "Algeria => Yalidine bureau only" rule server-side, so a crafted request
  // can't select a disallowed delivery method.
  const allowedDelivery = getDeliveryOptions(ownedRestaurant.currency);
  if (!allowedDelivery.some((o) => o.id === deliveryMethod)) {
    return { error: 'Mode de livraison non disponible pour ce restaurant.' };
  }

  try {
    await db.designOrder.create({
      data: {
        userId: ownerId,
        restaurantId,
        designId,
        designName: product.name,
        quantity,
        contactName,
        contactEmail,
        contactPhone: contactPhone || null,
        deliveryMethod,
        notes: notes || null
      }
    });
  } catch (error) {
    console.error('Error creating design order:', error);
    return { error: 'Une erreur est survenue lors de la commande.' };
  }

  return {
    success: 'Votre commande a été envoyée. Notre équipe vous contactera bientôt.'
  };
}
