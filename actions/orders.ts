'use server';

import * as z from 'zod';
import type { OrderStatus, OrderType } from '@prisma/client';

import { db } from '@/lib/db';
import { SetOrderStatusSchema, SetOrderPaidSchema } from '@/schemas';
import { currentUserId } from '@/lib/authentication';
import { getWorkspaceOwnerId } from '@/data/workspace';
import { assertOrderOwned } from '@/data/orders';

type ActionResult =
  | { error: string; success?: undefined }
  | { success: string; error?: undefined };

// Allowed status sets per order type (D13b). CANCELLED is allowed from any
// non-terminal state.
const DINE_IN_STATUSES: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'SERVED',
  'COMPLETED',
  'CANCELLED'
];
const DELIVERY_STATUSES: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
];

function isStatusValidForType(type: OrderType, status: OrderStatus): boolean {
  return (type === 'DELIVERY' ? DELIVERY_STATUSES : DINE_IN_STATUSES).includes(
    status
  );
}

/**
 * Update an order's status (FEAT-1). Allowed for the workspace OWNER and its
 * MEMBERS (staff/kitchen, D6). The order must belong to the caller's workspace,
 * and the target status must be valid for the order's type (dine-in vs
 * delivery). Never trust the client — everything is re-checked server-side.
 */
export async function setOrderStatus(
  values: z.infer<typeof SetOrderStatusSchema>
): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) {
    return { error: 'Non autorisé.' };
  }

  const parsed = SetOrderStatusSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Données invalides.' };
  }

  const { orderId, status } = parsed.data;

  // Scope to the caller's workspace owner (members resolve to their owner).
  const ownerId = await getWorkspaceOwnerId(userId);
  const owned = await assertOrderOwned(orderId, ownerId);
  if (!owned) {
    return { error: 'Commande introuvable.' };
  }

  if (!isStatusValidForType(owned.type, status)) {
    return { error: 'Statut invalide pour ce type de commande.' };
  }

  try {
    await db.order.update({
      where: { id: orderId },
      data: { status }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return { error: 'Impossible de mettre à jour la commande.' };
  }

  return { success: 'Statut mis à jour.' };
}


/**
 * Mark an order as paid / not paid (FEAT-1, pay-in-person). Allowed for the
 * workspace OWNER and its MEMBERS. Stamps `paidAt` when marking paid, clears it
 * when un-marking. Scoped to the caller's workspace.
 */
export async function setOrderPaid(
  values: z.infer<typeof SetOrderPaidSchema>
): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) {
    return { error: 'Non autorisé.' };
  }

  const parsed = SetOrderPaidSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Données invalides.' };
  }

  const { orderId, paid } = parsed.data;

  const ownerId = await getWorkspaceOwnerId(userId);
  const owned = await assertOrderOwned(orderId, ownerId);
  if (!owned) {
    return { error: 'Commande introuvable.' };
  }

  try {
    await db.order.update({
      where: { id: orderId },
      data: { paid, paidAt: paid ? new Date() : null }
    });
  } catch (error) {
    console.error('Error updating order payment:', error);
    return { error: 'Impossible de mettre à jour le paiement.' };
  }

  return { success: paid ? 'Commande marquée payée.' : 'Paiement annulé.' };
}
