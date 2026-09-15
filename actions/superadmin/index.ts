'use server';

import * as z from 'zod';
import { UserRole } from '@prisma/client';

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/lib/db';
import { currentRole, currentUserId } from '@/lib/authentication';
import { getUserByEmail } from '@/data/user';
import { stripe, isStripeEnabled } from '@/lib/stripe';
import {
  buildPathMenuUrl,
  normalizeSubdomain,
  validateSubdomain
} from '@/lib/subdomain';
import {
  SuperadminSetPlanSchema,
  SuperadminSetSuspendedSchema,
  SuperadminDeleteUserSchema,
  SuperadminSetDesignOrderStatusSchema,
  SuperadminSetOrderingEnabledSchema,
  SuperadminCreateUserSchema,
  SuperadminCancelSubscriptionSchema,
  SuperadminSetSupportStatusSchema,
  SuperadminUpsertRestaurantSchema,
  SuperadminDeleteRestaurantSchema
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


/**
 * Create a user account directly (bypassing self-service sign-up + email
 * verification). The account is created email-verified. When `ownerUserId` is
 * provided, the new user is tied to that OWNER as a team MEMBER (bypassing the
 * invitation flow) — the target must not already be a member/own a team.
 */
export async function superadminCreateUser(
  values: z.infer<typeof SuperadminCreateUserSchema>
): Promise<ActionResult & { userId?: string }> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SuperadminCreateUserSchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  const { name, email, password, role, ownerUserId } = parsed.data;

  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: 'Un compte existe déjà avec cet e-mail.' };
  }

  // If tying to an owner, validate the owner exists and is a valid workspace
  // root (not itself a member of another workspace).
  if (ownerUserId) {
    const owner = await db.user.findUnique({
      where: { id: ownerUserId },
      select: { id: true, memberOf: { select: { id: true } } }
    });
    if (!owner) return { error: 'Compte propriétaire introuvable.' };
    if (owner.memberOf) {
      return {
        error: 'Ce propriétaire est lui-même membre d’un autre espace.'
      };
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const created = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          // Superadmin-created accounts are trusted → mark verified.
          emailVerified: new Date()
        },
        select: { id: true }
      });

      if (ownerUserId) {
        await tx.membership.create({
          data: { ownerUserId, memberUserId: user.id, role: 'MEMBER' }
        });
      }

      return user;
    });

    return {
      success: ownerUserId
        ? 'Compte créé et rattaché à l’espace du propriétaire.'
        : 'Compte créé.',
      userId: created.id
    };
  } catch {
    return { error: 'Impossible de créer le compte.' };
  }
}


/**
 * Cancel a user's ONLINE (Stripe) subscription at period end. The user keeps
 * access until `planRenewsAt`; the Stripe webhook reverts them to STARTER when
 * the subscription actually ends. No-op-with-error if the user has no Stripe
 * subscription.
 */
export async function superadminCancelSubscription(
  values: z.infer<typeof SuperadminCancelSubscriptionSchema>
): Promise<ActionResult> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SuperadminCancelSubscriptionSchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  if (!isStripeEnabled() || !stripe) {
    return { error: 'Stripe n’est pas configuré.' };
  }

  const user = await db.user.findUnique({
    where: { id: parsed.data.userId },
    select: { stripeSubscriptionId: true }
  });
  if (!user?.stripeSubscriptionId) {
    return { error: 'Aucun abonnement en ligne pour ce compte.' };
  }

  try {
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
  } catch {
    return { error: 'Impossible d’annuler l’abonnement.' };
  }

  return { success: 'Abonnement en ligne annulé (fin de période).' };
}


/** Update a support message's triage status (NEW / READ / RESOLVED). */
export async function superadminSetSupportStatus(
  values: z.infer<typeof SuperadminSetSupportStatusSchema>
): Promise<ActionResult> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SuperadminSetSupportStatusSchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  try {
    await db.supportMessage.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status }
    });
  } catch {
    return { error: 'Impossible de mettre à jour le message.' };
  }

  return { success: 'Message mis à jour.' };
}


/**
 * Create or update a restaurant on behalf of ANY user (bypassing the owner-only
 * guards on /api/magasin). On create, `ownerUserId` is required and the plan
 * limit is intentionally NOT enforced (superadmin override). Subdomain is
 * normalized/validated and kept globally unique.
 */
export async function superadminUpsertRestaurant(
  values: z.infer<typeof SuperadminUpsertRestaurantSchema>
): Promise<ActionResult & { restaurantId?: string }> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SuperadminUpsertRestaurantSchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  const {
    id,
    ownerUserId,
    name,
    address,
    phone,
    currency,
    subdomain,
    coverPhoto,
    wifi,
    website,
    instagram,
    tiktok,
    google
  } = parsed.data;

  // Normalize + validate the subdomain when provided.
  let normalizedSubdomain: string | undefined;
  if (subdomain !== undefined && subdomain !== '') {
    normalizedSubdomain = normalizeSubdomain(subdomain);
    const subError = validateSubdomain(normalizedSubdomain);
    if (subError) return { error: subError };
  }

  const socials = {
    wifi: wifi || null,
    website: website || null,
    instagram: instagram || null,
    tiktok: tiktok || null,
    google: google || null
  };

  try {
    if (id) {
      // ----- Update -----
      const existing = await db.restaurant.findUnique({
        where: { id },
        select: { id: true }
      });
      if (!existing) return { error: 'Restaurant introuvable.' };

      // Enforce subdomain uniqueness (excluding this restaurant).
      if (normalizedSubdomain) {
        const taken = await db.restaurant.findFirst({
          where: { subdomain: normalizedSubdomain, id: { not: id } },
          select: { id: true }
        });
        if (taken) {
          return {
            error: 'Ce lien d’accès est déjà utilisé. Choisissez-en un autre.'
          };
        }
      }

      await db.restaurant.update({
        where: { id },
        data: {
          name,
          address,
          phone,
          currency,
          ...(coverPhoto ? { coverPhoto } : {}),
          ...(normalizedSubdomain ? { subdomain: normalizedSubdomain } : {}),
          ...socials,
          updatedAt: new Date()
        }
      });

      return { success: 'Restaurant mis à jour.', restaurantId: id };
    }

    // ----- Create -----
    if (!ownerUserId) {
      return { error: 'Propriétaire requis pour créer un restaurant.' };
    }
    const owner = await db.user.findUnique({
      where: { id: ownerUserId },
      select: { id: true }
    });
    if (!owner) return { error: 'Compte propriétaire introuvable.' };

    if (normalizedSubdomain) {
      const existingSub = await db.restaurant.findUnique({
        where: { subdomain: normalizedSubdomain },
        select: { id: true }
      });
      if (existingSub) {
        return {
          error: 'Ce lien d’accès est déjà utilisé. Choisissez-en un autre.'
        };
      }
    }

    const newId = uuidv4();
    await db.restaurant.create({
      data: {
        id: newId,
        name,
        address,
        phone,
        currency,
        coverPhoto: coverPhoto || 'uploads/1735415131028bg-food.jpg',
        qrUrl: buildPathMenuUrl(newId),
        subdomain: normalizedSubdomain ?? null,
        ...socials,
        userId: ownerUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return { success: 'Restaurant créé.', restaurantId: newId };
  } catch {
    return { error: 'Impossible d’enregistrer le restaurant.' };
  }
}


/** Delete a restaurant (any owner) by id. Cascades to its menus/data. */
export async function superadminDeleteRestaurant(
  values: z.infer<typeof SuperadminDeleteRestaurantSchema>
): Promise<ActionResult> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SuperadminDeleteRestaurantSchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  try {
    await db.restaurant.delete({ where: { id: parsed.data.id } });
  } catch {
    return { error: 'Impossible de supprimer le restaurant.' };
  }

  return { success: 'Restaurant supprimé.' };
}
