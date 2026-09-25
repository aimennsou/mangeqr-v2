'use server';

import * as z from 'zod';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { SetOrderStatusSchema, SetOrderPaidSchema } from '@/schemas';
import { currentUserId } from '@/lib/authentication';
import { getWorkspaceContext, memberCanAccess } from '@/data/workspace';
import { assertOrderOwned } from '@/data/orders';
import { isTransitionAllowed } from '@/lib/order-flow';

type ActionResult =
  | { error: string; success?: undefined }
  | { success: string; error?: undefined };

/**
 * Pages and server-rendered views that read order data. Revalidated after every
 * order mutation so anything not driven by the boards' own polling (performance
 * KPIs, table occupancy) doesn't serve a stale cache.
 */
const ORDER_PATHS = ['/commandes', '/cuisine', '/tables', '/performances'];

function revalidateOrderViews() {
  for (const path of ORDER_PATHS) {
    revalidatePath(path);
  }
}

/**
 * Update an order's status (FEAT-1). Allowed for the workspace OWNER and for
 * MEMBERS granted the `orders` permission (staff/kitchen, D6). The order must
 * belong to the caller's workspace and the transition must be legal for the
 * order's type. Never trust the client — everything is re-checked server-side.
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

  // Scope to the caller's workspace owner (members resolve to their owner) and
  // require the `orders` permission for members.
  const { ownerId } = await getWorkspaceContext(userId);
  if (!(await memberCanAccess(userId, 'orders'))) {
    return { error: 'Accès non autorisé à la prise de commande.' };
  }

  const owned = await assertOrderOwned(orderId, ownerId);
  if (!owned) {
    return { error: 'Commande introuvable.' };
  }

  if (!isTransitionAllowed(owned.type, owned.status, status)) {
    return { error: 'Changement de statut non autorisé.' };
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

  revalidateOrderViews();
  return { success: 'Statut mis à jour.' };
}


/**
 * Mark an order as paid / not paid (FEAT-1, pay-in-person). Allowed for the
 * workspace OWNER and for MEMBERS granted the `orders` permission. Stamps
 * `paidAt` when marking paid, clears it when un-marking. Scoped to the caller's
 * workspace.
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

  const { ownerId } = await getWorkspaceContext(userId);
  if (!(await memberCanAccess(userId, 'orders'))) {
    return { error: 'Accès non autorisé à la prise de commande.' };
  }

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

  revalidateOrderViews();
  return { success: paid ? 'Commande marquée payée.' : 'Paiement annulé.' };
}
