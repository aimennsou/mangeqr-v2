'use server';

import * as z from 'zod';

import { currentUser } from '@/lib/authentication';
import {
  canAddMember,
  createInvitation,
  revokeInvitation,
  removeMember,
  isWorkspaceMember,
  consumeInvitationAndCreateMembership,
} from '@/data/workspace';

/**
 * Team / workspace Server Actions (mangeqr-team, T6).
 *
 * All mutations follow the project convention: `'use server'`, validate input
 * with zod where there is any, and return `{ error }` / `{ success }` shaped
 * objects. Owner-only actions reject workspace MEMBERS server-side (defense in
 * depth on top of the UX hiding in T9). Data access goes exclusively through the
 * `data/workspace.ts` helpers (which use the shared Prisma client).
 */

/** Owner-only guard message reused across actions. */
const OWNER_ONLY_ERROR = 'Action réservée au propriétaire du compte.';

/**
 * Build the redeem link for an invite code. Uses `NEXT_PUBLIC_APP_URL` as the
 * origin when available, otherwise falls back to a relative path (still usable
 * as a same-origin link).
 */
function buildRedeemLink(code: string): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ?? '';
  const path = `/team/join?code=${encodeURIComponent(code)}`;
  return origin ? `${origin}${path}` : path;
}

/**
 * Generate a one-time invite code for the owner's workspace (R3.1).
 *
 * Owner-only: rejects members. Enforces seats against the owner's EFFECTIVE
 * plan (R2) — STARTER (0 seats) or a full workspace is refused with a French
 * message. On success returns the code and a copyable redeem link.
 */
export async function generateInvite(): Promise<
  { error: string } | { success: string; code: string; link: string }
> {
  const user = await currentUser();
  if (!user?.id) {
    return { error: 'Non autorisé.' };
  }

  // Owner-only: members cannot generate invites.
  if (await isWorkspaceMember(user.id)) {
    return { error: OWNER_ONLY_ERROR };
  }

  const ownerId = user.id;

  // Seat enforcement (expiry-aware) before creating an invite.
  const seats = await canAddMember(ownerId);
  if (!seats.ok) {
    if (seats.limit === 0) {
      return {
        error:
          "Votre plan actuel n'inclut aucun collaborateur. Passez à un plan supérieur pour inviter votre équipe.",
      };
    }
    return {
      error: `Limite de collaborateurs atteinte (${seats.used}/${seats.limit}). Retirez un membre ou passez à un plan supérieur.`,
    };
  }

  try {
    const invitation = await createInvitation(ownerId);
    return {
      success: "Code d'invitation généré.",
      code: invitation.code,
      link: buildRedeemLink(invitation.code),
    };
  } catch {
    return { error: "Impossible de générer le code d'invitation." };
  }
}

const IdSchema = z.string().uuid({ message: 'Identifiant invalide.' });

/**
 * Revoke a pending invitation (R3.4). Owner-only; scoped to the caller's own
 * invitations inside the data layer.
 */
export async function revokeInvite(
  invitationId: string
): Promise<{ error: string } | { success: string }> {
  const user = await currentUser();
  if (!user?.id) {
    return { error: 'Non autorisé.' };
  }

  if (await isWorkspaceMember(user.id)) {
    return { error: OWNER_ONLY_ERROR };
  }

  const parsed = IdSchema.safeParse(invitationId);
  if (!parsed.success) {
    return { error: 'Identifiant invalide.' };
  }

  const revoked = await revokeInvitation(user.id, parsed.data);
  if (!revoked) {
    return { error: 'Invitation introuvable ou déjà utilisée.' };
  }

  return { success: 'Invitation révoquée.' };
}

/**
 * Remove a member from the workspace (R5.1 / R6.1). Owner-only; scoped to the
 * caller's own memberships. Access is revoked immediately since scoping resolves
 * live membership.
 */
export async function removeTeamMember(
  membershipId: string
): Promise<{ error: string } | { success: string }> {
  const user = await currentUser();
  if (!user?.id) {
    return { error: 'Non autorisé.' };
  }

  if (await isWorkspaceMember(user.id)) {
    return { error: OWNER_ONLY_ERROR };
  }

  const parsed = IdSchema.safeParse(membershipId);
  if (!parsed.success) {
    return { error: 'Identifiant invalide.' };
  }

  const removed = await removeMember(user.id, parsed.data);
  if (!removed) {
    return { error: 'Membre introuvable.' };
  }

  return { success: 'Membre retiré.' };
}

const JoinSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { message: 'Veuillez saisir un code.' }),
});

/** Map a redeem failure reason to a French, user-facing message. */
function redeemReasonToMessage(
  reason:
    | 'invalid'
    | 'self'
    | 'already_member'
    | 'owns_team'
    | 'owns_restaurants'
    | 'seat_full'
): string {
  switch (reason) {
    case 'self':
      return 'Vous ne pouvez pas rejoindre votre propre espace de travail.';
    case 'already_member':
      return 'Vous êtes déjà membre d\'un espace de travail.';
    case 'owns_team':
      return 'Vous gérez déjà votre propre équipe et ne pouvez pas rejoindre un autre espace.';
    case 'owns_restaurants':
      return 'Vous possédez déjà des restaurants et ne pouvez pas rejoindre un autre espace.';
    case 'seat_full':
      return "Le nombre de collaborateurs de cet espace est atteint. Contactez le propriétaire.";
    case 'invalid':
    default:
      return 'Code invalide, expiré ou déjà utilisé.';
  }
}

/**
 * Join a workspace by redeeming an invite code (R3.5). Requires an authenticated
 * redeemer. Validation, seat enforcement, redeemer guards and one-time
 * consumption are all handled atomically in the data layer.
 */
export async function joinWorkspace(
  code: string
): Promise<{ error: string } | { success: string }> {
  const user = await currentUser();
  if (!user?.id) {
    return { error: 'Non autorisé.' };
  }

  const parsed = JoinSchema.safeParse({ code });
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? 'Code invalide.',
    };
  }

  const result = await consumeInvitationAndCreateMembership(
    parsed.data.code,
    user.id
  );

  if (!result.ok) {
    return { error: redeemReasonToMessage(result.reason) };
  }

  return { success: 'Vous avez rejoint l\'espace de travail.' };
}
