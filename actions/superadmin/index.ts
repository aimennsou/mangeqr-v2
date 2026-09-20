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
  SuperadminDeleteRestaurantSchema,
  SupportReplySchema,
  SuperadminSetLeadStatusSchema,
  SuperadminUpdateLeadSchema,
  SuperadminLogLeadCallSchema,
  SuperadminLeadNoteSchema,
  SuperadminConvertLeadSchema,
  SuperadminBroadcastSchema,
  SuperadminSetUpgradeStatusSchema
} from '@/schemas';
import { revalidatePath } from 'next/cache';
import {
  createNotification,
  createBroadcastNotifications,
} from '@/lib/notifications';

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
 * Leads-console access (#11): SUPERADMIN or STAFF. STAFF can follow up on leads
 * (call, log activity, update CRM fields, convert) but cannot touch the rest of
 * the superadmin console.
 */
async function requireLeadsAccess(): Promise<boolean> {
  const role = await currentRole();
  return role === UserRole.SUPERADMIN || role === UserRole.STAFF;
}

/** Label of the current staff member, for activity attribution. */
async function currentStaffLabel(): Promise<{ id: string | null; name: string }> {
  try {
    const id = (await currentUserId()) ?? null;
    if (!id) return { id: null, name: 'Staff' };
    const u = await db.user.findUnique({
      where: { id },
      select: { name: true, email: true },
    });
    return { id, name: u?.name ?? u?.email ?? 'Staff' };
  } catch {
    return { id: null, name: 'Staff' };
  }
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

  let order: { userId: string; designName: string } | null = null;
  try {
    order = await db.designOrder.update({
      where: { id: orderId },
      data: { status },
      select: { userId: true, designName: true }
    });
  } catch {
    return { error: 'Impossible de mettre à jour la commande.' };
  }

  // Notify the account owner that their design/printed-menu order advanced.
  if (order) {
    await createNotification({
      userId: order.userId,
      type: 'ORDER_STATUS',
      title: 'Mise à jour de votre commande',
      body: `« ${order.designName} » : ${DESIGN_ORDER_STATUS_LABELS[status] ?? status}.`,
      link: '/numerique',
      entityId: orderId,
    });
  }

  return { success: 'Statut de la commande mis à jour.' };
}

/** French labels for design-order statuses (used in notifications). */
const DESIGN_ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours de production',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};


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


/**
 * Post a STAFF reply to a support ticket and mark it READ (a staff answer means
 * the team has handled it — the user can still reply, which flips it back to
 * NEW). Superadmin-only.
 */
export async function superadminReplyToTicket(
  values: z.infer<typeof SupportReplySchema>
): Promise<ActionResult> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SupportReplySchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  const { ticketId, body } = parsed.data;

  const ticket = await db.supportMessage.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true }
  });
  if (!ticket) {
    return { error: 'Message introuvable.' };
  }

  try {
    await db.$transaction([
      db.supportReply.create({
        data: {
          ticketId,
          authorRole: 'STAFF',
          authorName: 'Support MangeQR',
          body
        }
      }),
      db.supportMessage.update({
        where: { id: ticketId },
        data: { status: 'READ' }
      })
    ]);
  } catch {
    return { error: 'Impossible d’envoyer la réponse.' };
  }

  // Notify the ticket owner (in-app messages carry a userId; anonymous landing
  // contact messages don't and are skipped).
  if (ticket.userId) {
    await createNotification({
      userId: ticket.userId,
      type: 'SUPPORT_REPLY',
      title: 'Réponse du support',
      body: 'Notre équipe a répondu à votre demande.',
      link: '/support',
      entityId: ticketId,
    });
  }

  return { success: 'Réponse envoyée.' };
}


/** Update a funnel lead's follow-up status. Superadmin-only. */
export async function superadminSetLeadStatus(
  values: z.infer<typeof SuperadminSetLeadStatusSchema>
): Promise<ActionResult> {
  if (!(await requireSuperadmin())) {
    return FORBIDDEN;
  }

  const parsed = SuperadminSetLeadStatusSchema.safeParse(values);
  if (!parsed.success) {
    return INVALID;
  }

  try {
    await db.leadMenu.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status }
    });
  } catch {
    return { error: 'Impossible de mettre à jour le lead.' };
  }

  return { success: 'Lead mis à jour.' };
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


// =============================================================================
// Leads CRM (#10 / #11 / #12) — SUPERADMIN or STAFF.
// =============================================================================

const LEADS_PATH = '/superadmin/leads';

/**
 * Update a lead's CRM follow-up fields (status, call/delivery/order sub-status,
 * assignee, follow-up notes, next follow-up date). Only the provided fields are
 * changed. Records a compact activity entry describing the change.
 */
export async function superadminUpdateLead(
  values: z.infer<typeof SuperadminUpdateLeadSchema>
): Promise<ActionResult> {
  if (!(await requireLeadsAccess())) return FORBIDDEN;

  const parsed = SuperadminUpdateLeadSchema.safeParse(values);
  if (!parsed.success) return INVALID;

  const {
    id,
    status,
    callStatus,
    deliveryStatus,
    orderStatus,
    assignedToId,
    followUpNotes,
    nextFollowUpAt,
  } = parsed.data;

  const data: Record<string, unknown> = {};
  const changes: string[] = [];
  if (status !== undefined) {
    data.status = status;
    changes.push(`statut → ${status}`);
  }
  if (callStatus !== undefined) {
    data.callStatus = callStatus;
    changes.push(`appel → ${callStatus}`);
  }
  if (deliveryStatus !== undefined) {
    data.deliveryStatus = deliveryStatus;
    changes.push(`livraison → ${deliveryStatus}`);
  }
  if (orderStatus !== undefined) {
    data.orderStatus = orderStatus;
    changes.push(`commande → ${orderStatus}`);
  }
  if (assignedToId !== undefined) {
    data.assignedToId = assignedToId;
    changes.push(assignedToId ? 'réassigné' : 'assignation retirée');
  }
  if (followUpNotes !== undefined) {
    data.followUpNotes = followUpNotes || null;
  }
  if (nextFollowUpAt !== undefined) {
    const d = nextFollowUpAt ? new Date(nextFollowUpAt) : null;
    if (d && Number.isNaN(d.getTime())) return INVALID;
    data.nextFollowUpAt = d;
    if (d) changes.push('relance planifiée');
  }

  if (Object.keys(data).length === 0) {
    return { success: 'Aucun changement.' };
  }

  const staff = await currentStaffLabel();

  try {
    await db.$transaction(async (tx) => {
      await tx.leadMenu.update({ where: { id }, data });
      if (changes.length > 0) {
        await tx.leadActivity.create({
          data: {
            leadId: id,
            authorId: staff.id,
            authorName: staff.name,
            kind: 'status',
            body: changes.join(', '),
          },
        });
      }
    });
  } catch {
    return { error: 'Impossible de mettre à jour le lead.' };
  }

  revalidatePath(LEADS_PATH);
  return { success: 'Lead mis à jour.' };
}

/**
 * Log a call attempt: increments callAttempts, sets the callStatus and
 * lastContactedAt, and records a "call" activity. When the second attempt is
 * logged, callStatus CALLED becomes CALLED_TWICE automatically.
 */
export async function superadminLogLeadCall(
  values: z.infer<typeof SuperadminLogLeadCallSchema>
): Promise<ActionResult> {
  if (!(await requireLeadsAccess())) return FORBIDDEN;

  const parsed = SuperadminLogLeadCallSchema.safeParse(values);
  if (!parsed.success) return INVALID;

  const { id, callStatus, note } = parsed.data;
  const staff = await currentStaffLabel();

  try {
    const lead = await db.leadMenu.findUnique({
      where: { id },
      select: { callAttempts: true },
    });
    if (!lead) return { error: 'Lead introuvable.' };

    const attempts = lead.callAttempts + 1;
    // Auto-promote to CALLED_TWICE on a second successful call.
    const resolvedStatus =
      callStatus === 'CALLED' && attempts >= 2 ? 'CALLED_TWICE' : callStatus;

    await db.$transaction(async (tx) => {
      await tx.leadMenu.update({
        where: { id },
        data: {
          callAttempts: attempts,
          callStatus: resolvedStatus,
          lastContactedAt: new Date(),
          // Moving a NEW lead into the pipeline once contacted.
          status: 'CONTACTED',
        },
      });
      await tx.leadActivity.create({
        data: {
          leadId: id,
          authorId: staff.id,
          authorName: staff.name,
          kind: 'call',
          body: `Appel #${attempts} — ${resolvedStatus}${note ? ` : ${note}` : ''}`,
        },
      });
    });
  } catch {
    return { error: "Impossible d'enregistrer l'appel." };
  }

  revalidatePath(LEADS_PATH);
  return { success: 'Appel enregistré.' };
}

/** Add a free-form note to a lead's timeline. */
export async function superadminAddLeadNote(
  values: z.infer<typeof SuperadminLeadNoteSchema>
): Promise<ActionResult> {
  if (!(await requireLeadsAccess())) return FORBIDDEN;

  const parsed = SuperadminLeadNoteSchema.safeParse(values);
  if (!parsed.success) return INVALID;

  const staff = await currentStaffLabel();
  try {
    await db.leadActivity.create({
      data: {
        leadId: parsed.data.id,
        authorId: staff.id,
        authorName: staff.name,
        kind: 'note',
        body: parsed.data.body,
      },
    });
  } catch {
    return { error: "Impossible d'ajouter la note." };
  }

  revalidatePath(LEADS_PATH);
  return { success: 'Note ajoutée.' };
}

/**
 * Convert a funnel lead into a real account (#12): creates the user
 * (email-verified, onboarded) and materializes the stored menu JSON into a
 * restaurant → menu → categories → dishes, then links the lead to the new
 * account. Idempotent guard: refuses if the lead was already converted or the
 * email is taken.
 */
export async function superadminConvertLead(
  values: z.infer<typeof SuperadminConvertLeadSchema>
): Promise<ActionResult & { userId?: string; restaurantId?: string }> {
  if (!(await requireLeadsAccess())) return FORBIDDEN;

  const parsed = SuperadminConvertLeadSchema.safeParse(values);
  if (!parsed.success) return INVALID;

  const { id, name, email, password, plan } = parsed.data;

  const lead = await db.leadMenu.findUnique({ where: { id } });
  if (!lead) return { error: 'Lead introuvable.' };
  if (lead.convertedUserId) {
    return { error: 'Ce lead a déjà été converti en compte.' };
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: 'Un compte existe déjà avec cet e-mail.' };
  }

  // Parse the stored menu JSON.
  const menuJson = lead.data as {
    categories?: {
      name?: string;
      dishes?: { name?: string; description?: string; price?: number | string }[];
    }[];
  };
  const categories = Array.isArray(menuJson?.categories)
    ? menuJson.categories
    : [];

  // Map the funnel currency string onto the Currency enum.
  const currency =
    lead.currency === 'DOLLAR' || lead.currency === 'DINAR'
      ? lead.currency
      : 'EURO';

  const hashedPassword = await bcrypt.hash(password, 10);
  const staff = await currentStaffLabel();

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'USER',
          plan: plan ?? 'STARTER',
          emailVerified: new Date(),
          onboardedAt: new Date(),
        },
        select: { id: true },
      });

      const restaurantId = uuidv4();
      await tx.restaurant.create({
        data: {
          id: restaurantId,
          userId: user.id,
          name: lead.restaurantName,
          address: lead.notes?.slice(0, 200) || 'À compléter',
          phone: lead.contactPhone || 'À compléter',
          currency: currency as 'EURO' | 'DOLLAR' | 'DINAR',
          coverPhoto: 'uploads/1735415131028bg-food.jpg',
          qrUrl: buildPathMenuUrl(restaurantId),
        },
      });

      const menu = await tx.menu.create({
        data: {
          restaurantId,
          name: lead.restaurantName,
          position: 0,
          availability: [],
        },
        select: { id: true },
      });

      // Materialize categories + dishes preserving order.
      for (let ci = 0; ci < categories.length; ci++) {
        const cat = categories[ci];
        const category = await tx.menuCategory.create({
          data: {
            menuId: menu.id,
            name: cat?.name?.trim() || `Catégorie ${ci + 1}`,
            position: ci,
          },
          select: { id: true },
        });
        const dishes = Array.isArray(cat?.dishes) ? cat!.dishes : [];
        for (let di = 0; di < dishes.length; di++) {
          const d = dishes[di];
          const price =
            typeof d?.price === 'number'
              ? d.price
              : parseFloat(String(d?.price ?? '0')) || 0;
          await tx.dish.create({
            data: {
              categoryId: category.id,
              name: d?.name?.trim() || `Plat ${di + 1}`,
              description: d?.description?.trim() || null,
              price,
              position: di,
              allergenes: [],
            },
          });
        }
      }

      // #1: if the lead already placed a design order via the funnel, carry it
      // over as a real DesignOrder for the new account so it shows up in the
      // user's "Mes commandes" tracking. Preserve the original status when it's
      // a valid design-order status, otherwise default to PENDING.
      if (lead.designId) {
        await tx.designOrder.create({
          data: {
            userId: user.id,
            restaurantId,
            designId: lead.designId,
            designName: lead.designName ?? lead.designId,
            quantity: lead.quantity ?? 1,
            contactName: lead.contactName ?? name,
            contactEmail: lead.contactEmail ?? email,
            contactPhone: lead.contactPhone ?? null,
            deliveryMethod: lead.deliveryMethod ?? null,
            notes: lead.notes ?? null,
            status: 'PENDING',
          },
        });
      }

      await tx.leadMenu.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          convertedUserId: user.id,
          convertedRestaurantId: restaurantId,
          convertedAt: new Date(),
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: id,
          authorId: staff.id,
          authorName: staff.name,
          kind: 'convert',
          body: lead.designId
            ? `Converti en compte (${email}) avec sa commande de design.`
            : `Converti en compte (${email}).`,
        },
      });

      return { userId: user.id, restaurantId };
    });

    revalidatePath(LEADS_PATH);
    return {
      success: 'Lead converti en compte avec son menu.',
      userId: result.userId,
      restaurantId: result.restaurantId,
    };
  } catch {
    return { error: 'Impossible de convertir le lead.' };
  }
}


/**
 * Broadcast an in-app notification to users (#14). SUPERADMIN-only. Audience is
 * either every user or only paid-plan (PRO/PREMIUM) accounts. Returns how many
 * notifications were created.
 */
export async function superadminBroadcast(
  values: z.infer<typeof SuperadminBroadcastSchema>
): Promise<ActionResult & { count?: number }> {
  if (!(await requireSuperadmin())) return FORBIDDEN;

  const parsed = SuperadminBroadcastSchema.safeParse(values);
  if (!parsed.success) return INVALID;

  const { title, body, link, audience } = parsed.data;

  try {
    const users = await db.user.findMany({
      where:
        audience === 'PAID'
          ? { plan: { in: ['PRO', 'PREMIUM'] } }
          : {},
      select: { id: true },
    });
    const count = await createBroadcastNotifications(
      users.map((u) => u.id),
      title,
      body || null,
      link || null,
    );
    return { success: `Notification envoyée à ${count} compte(s).`, count };
  } catch {
    return { error: "Impossible d'envoyer la notification." };
  }
}


/**
 * Update a cash plan-upgrade request's status (#2). SUPERADMIN-only. When set to
 * APPROVED, the target plan is granted to the account (cash payment method) with
 * a 1-year expiry — the back-office marks it approved after taking payment.
 */
export async function superadminSetUpgradeStatus(
  values: z.infer<typeof SuperadminSetUpgradeStatusSchema>
): Promise<ActionResult> {
  if (!(await requireSuperadmin())) return FORBIDDEN;

  const parsed = SuperadminSetUpgradeStatusSchema.safeParse(values);
  if (!parsed.success) return INVALID;

  const { id, status } = parsed.data;

  try {
    const request = await db.planUpgradeRequest.findUnique({
      where: { id },
      select: { userId: true, targetPlan: true, frequency: true },
    });
    if (!request) return { error: 'Demande introuvable.' };

    if (status === 'APPROVED') {
      // Grant the requested plan (cash) with a 1-year expiry from now.
      const renewsAt = new Date();
      renewsAt.setFullYear(renewsAt.getFullYear() + 1);
      await db.$transaction([
        db.planUpgradeRequest.update({ where: { id }, data: { status } }),
        db.user.update({
          where: { id: request.userId },
          data: {
            plan: request.targetPlan,
            planPaymentMethod: 'CASH',
            planRenewsAt: renewsAt,
          },
        }),
      ]);
      // Let the user know their upgrade is live.
      await createNotification({
        userId: request.userId,
        type: 'BROADCAST',
        title: 'Forfait mis à niveau',
        body: `Votre forfait ${request.targetPlan} est actif.`,
        link: '/settings',
        entityId: id,
      });
    } else {
      await db.planUpgradeRequest.update({ where: { id }, data: { status } });
    }
  } catch {
    return { error: 'Impossible de mettre à jour la demande.' };
  }

  revalidatePath('/superadmin/upgrades');
  return { success: 'Demande mise à jour.' };
}
