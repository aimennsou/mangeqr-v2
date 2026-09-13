'use server';

import * as z from 'zod';
import { UserRole } from '@prisma/client';

import { db } from '@/lib/db';
import { currentRole, currentUserId } from '@/lib/authentication';
import {
  SuperadminSetPlanSchema,
  SuperadminSetSuspendedSchema,
  SuperadminDeleteUserSchema,
  SuperadminSetDesignOrderStatusSchema,
  SuperadminSetOrderingEnabledSchema
} from '@/schemas';

/**
 * SUPERADMIN-only server actions for the cash-subscription console
 * (superadmin, S5).
 *
 * Every action:
 *   - verifies the caller's role is SUPERADMIN (never trust the client),
 *   - zod-validates its input,
 *   - for suspend/delete: refuses to act on SELF or on another SUPERADMIN,
 *   - returns `{ error }` / `{ success }`.
 *
 * These are separate from `actions/admin-set-plan.ts` (ADMIN-gated), which is
 * left untouched.
 */

type ActionResult = { error: string; success?: undefined } | { success: string; error?: undefined };

const FORBIDDEN: ActionResult = {
  error: 'Action réservée au super administrateur.'
};
const INVALID: ActionResult = { error: 'Données invalides.' };

async function requireSuperadmin(): Promise<boolean> {
  const role = await currentRole();
  return role === UserRole.SUPERADMIN;
}

/**
 * Set a user's plan, payment method and expiry (cash/offline subscription).
 * Allowed on any user. `planRenewsAt` is the expiry (null = no expiry).
 */
export async function superadminSetUserPlan(
  values: z.infer<typeof SuperadminSetPlanSchema>
): Promise<ActionResult> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SuperadminSetPlanSchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  const { userId, plan, planPaymentMethod, planRenewsAt } = parsed.data;

  const renewsAt = planRenewsAt ? new Date(planRenewsAt) : null;
  if (renewsAt && Number.isNaN(renewsAt.getTime())) {
    return INVALID;
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { plan, planPaymentMethod, planRenewsAt: renewsAt }
    });
  } catch {
    return { error: "Impossible de mettre à jour l'abonnement." };
  }

  return { success: 'Abonnement mis à jour.' };
}

/**
 * Suspend / reactivate a user. Suspended users cannot sign in (auth callbacks).
 * GUARD: cannot suspend self, cannot suspend another SUPERADMIN.
 */
export async function superadminSetSuspended(
  values: z.infer<typeof SuperadminSetSuspendedSchema>
): Promise<ActionResult> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SuperadminSetSuspendedSchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  const { userId, suspended, reason } = parsed.data;

  const actingUserId = await currentUserId();
  if (userId === actingUserId) {
    return { error: 'Vous ne pouvez pas suspendre votre propre compte.' };
  }

  let target;
  try {
    target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });
  } catch {
    return { error: 'Utilisateur introuvable.' };
  }

  if (!target) {
    return { error: 'Utilisateur introuvable.' };
  }

  if (target.role === UserRole.SUPERADMIN) {
    return { error: 'Impossible de suspendre un super administrateur.' };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        suspended,
        suspendedAt: suspended ? new Date() : null,
        suspendedReason: suspended ? reason ?? null : null
      }
    });
  } catch {
    return { error: "Impossible de mettre à jour le compte." };
  }

  return {
    success: suspended ? 'Compte suspendu.' : 'Compte réactivé.'
  };
}

/**
 * Delete a user (cascades their restaurants/data via onDelete: Cascade).
 * GUARD: cannot delete self, cannot delete another SUPERADMIN.
 */
export async function superadminDeleteUser(
  values: z.infer<typeof SuperadminDeleteUserSchema>
): Promise<ActionResult> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SuperadminDeleteUserSchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  const { userId } = parsed.data;

  const actingUserId = await currentUserId();
  if (userId === actingUserId) {
    return { error: 'Vous ne pouvez pas supprimer votre propre compte.' };
  }

  let target;
  try {
    target = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });
  } catch {
    return { error: 'Utilisateur introuvable.' };
  }

  if (!target) {
    return { error: 'Utilisateur introuvable.' };
  }

  if (target.role === UserRole.SUPERADMIN) {
    return { error: 'Impossible de supprimer un super administrateur.' };
  }

  try {
    await db.user.delete({ where: { id: userId } });
  } catch {
    return { error: "Impossible de supprimer l'utilisateur." };
  }

  return { success: 'Utilisateur supprimé.' };
}


/**
 * Update a design order's fulfillment status (FEAT-6). SUPERADMIN-only. The
 * superadmin fulfills every account's QR-design orders centrally, so this is
 * NOT workspace-scoped — any order can be advanced through
 * PENDING → IN_PROGRESS → SHIPPED → DELIVERED (or CANCELLED).
 */
export async function superadminSetDesignOrderStatus(
  values: z.infer<typeof SuperadminSetDesignOrderStatusSchema>
): Promise<ActionResult> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SuperadminSetDesignOrderStatusSchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  const { orderId, status } = parsed.data;

  try {
    await db.designOrder.update({
      where: { id: orderId },
      data: { status }
    });
  } catch {
    return { error: 'Impossible de mettre à jour la commande.' };
  }

  return { success: 'Statut de la commande mis à jour.' };
}


/**
 * Enable/disable ORDERING for an account (FEAT-1/D16). SUPERADMIN-only. Turning
 * this off hides the ordering nav + disables diner ordering for all the
 * account's restaurants (the per-restaurant toggle is only effective when the
 * account is enabled).
 */
export async function superadminSetOrderingEnabled(
  values: z.infer<typeof SuperadminSetOrderingEnabledSchema>
): Promise<ActionResult> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SuperadminSetOrderingEnabledSchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  const { userId, enabled } = parsed.data;

  try {
    await db.user.update({
      where: { id: userId },
      data: { orderingEnabled: enabled }
    });
  } catch {
    return { error: "Impossible de mettre à jour l'accès aux commandes." };
  }

  return {
    success: enabled ? 'Commandes activées.' : 'Commandes désactivées.'
  };
}
