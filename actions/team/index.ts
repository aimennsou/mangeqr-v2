'use server';

import * as z from 'zod';
import bcrypt from 'bcryptjs';

import { currentUser } from '@/lib/authentication';
import { db } from '@/lib/db';
import { getUserByEmail } from '@/data/user';
import { sendTeamInvitationEmail, sendPasswordResetEmail } from '@/lib/mail';
import { generatePasswordResetToken } from '@/lib/tokens';
// Single definition of the invite link. This module used to carry its own
// `buildRedeemLink`, and app/(protected)/settings/page.tsx carried a second one
// pointing at a DIFFERENT (auth-gated) path — see lib/team-invite.ts.
import { buildInviteLink, buildPasswordResetLink } from '@/lib/team-invite';
import { memberLandingHref } from '@/lib/permissions';
import {
  CreateInviteSchema,
  SignUpAndJoinSchema,
  UpdateMemberPermissionsSchema,
} from '@/schemas';
import {
  canAddMember,
  createInvitation,
  revokeInvitation,
  removeMember,
  updateMemberPermissions,
  isWorkspaceMember,
  consumeInvitationAndCreateMembership,
  findValidInvitationByCode,
  getMemberForOwner,
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
 * Generate a one-time invite code for the owner's workspace (R3.1).
 *
 * Owner-only: rejects members. Enforces seats against the owner's EFFECTIVE
 * plan (R2) — STARTER (0 seats) or a full workspace is refused with a French
 * message. On success returns the code and a copyable redeem link.
 */
export async function generateInvite(
  values?: z.infer<typeof CreateInviteSchema>
): Promise<
  | { error: string }
  | {
      success: string;
      code: string;
      link: string;
      /** True when an invitation email was actually dispatched. */
      emailed: boolean;
    }
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

  // Optional invitee prefill (invite-without-account, #13).
  const parsed = CreateInviteSchema.safeParse(values ?? {});
  if (!parsed.success) {
    return { error: 'Coordonnées invalides.' };
  }

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
    const invitation = await createInvitation(ownerId, {
      inviteeName: parsed.data.inviteeName || null,
      inviteeEmail: parsed.data.inviteeEmail || null,
      inviteePhone: parsed.data.inviteePhone || null,
      label: parsed.data.label || null,
      permissions: parsed.data.permissions ?? null,
      restaurantIds: parsed.data.restaurantIds ?? null,
    });

    const link = buildInviteLink(invitation.code);

    // Email the invitee when the owner supplied an address. `inviteeEmail` was
    // already being collected and stored but nothing was ever sent — the owner
    // had to copy the link and share it manually. Sending is best-effort: the
    // code/link stays valid either way, so a mail failure must not fail the
    // action, but we DO report which happened rather than implying an email
    // went out when it didn't.
    let emailed = false;
    if (invitation.inviteeEmail) {
      emailed = await sendTeamInvitationEmail({
        email: invitation.inviteeEmail,
        name: invitation.inviteeName,
        ownerName: user.name ?? null,
        code: invitation.code,
        inviteLink: link,
      });
    }

    return {
      success: emailed
        ? `Invitation envoyée à ${invitation.inviteeEmail}.`
        : "Code d'invitation généré. Partagez le lien avec votre collaborateur.",
      code: invitation.code,
      link,
      emailed,
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

/**
 * Update a member's granular permissions (owner-only). Scoped to the caller's
 * own memberships in the data layer.
 */
export async function updateTeamMemberPermissions(
  values: z.infer<typeof UpdateMemberPermissionsSchema>
): Promise<{ error: string } | { success: string }> {
  const user = await currentUser();
  if (!user?.id) {
    return { error: 'Non autorisé.' };
  }
  if (await isWorkspaceMember(user.id)) {
    return { error: OWNER_ONLY_ERROR };
  }

  const parsed = UpdateMemberPermissionsSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Données invalides.' };
  }

  const ok = await updateMemberPermissions(
    user.id,
    parsed.data.membershipId,
    parsed.data.permissions,
    // `undefined` leaves the existing scope alone; an array (possibly empty,
    // which normalizes to "all") replaces it.
    parsed.data.restaurantIds
  );
  if (!ok) {
    return { error: 'Membre introuvable.' };
  }

  return { success: 'Permissions mises à jour.' };
}

/**
 * Start a password reset for one of the owner's team members (owner-only).
 *
 * DELIBERATELY DOES NOT SET A PASSWORD, and there is nowhere in this codebase
 * that a member's password could be read back: `User.password` only ever holds a
 * bcrypt hash. So the owner cannot be shown "the member's password" — the honest
 * equivalent is to let them hand over a one-time reset link and have the member
 * choose their own.
 *
 * Mechanics: reuses the SAME machinery as the public "mot de passe oublié" flow
 * (`generatePasswordResetToken` -> `PasswordResetToken`, consumed by
 * `actions/reset-password.ts`), so no new table, token format or expiry rule is
 * introduced. One hour, single use, and generating a new one invalidates the
 * previous token for that address.
 *
 * The existing password keeps working until the link is actually used, so this is
 * safe to trigger by mistake — it locks nobody out.
 *
 * The link is RETURNED to the owner as well as emailed. That is intentional: the
 * email send is best-effort (Resend is skipped entirely when `RESEND_API_KEY` is
 * unset, and staff addresses on a shared restaurant mailbox often don't reach the
 * person), so without the returned link a failed send would leave the owner with
 * no way to help their member. It is a strict improvement over showing a
 * password: single-use and short-lived.
 */
export async function resetMemberPassword(
  membershipId: string
): Promise<
  | { error: string }
  | { success: string; link: string; email: string; emailed: boolean }
> {
  const user = await currentUser();
  if (!user?.id) {
    return { error: 'Non autorisé.' };
  }

  // Owner-only: a member must not be able to reset a colleague's password.
  if (await isWorkspaceMember(user.id)) {
    return { error: OWNER_ONLY_ERROR };
  }

  const parsed = IdSchema.safeParse(membershipId);
  if (!parsed.success) {
    return { error: 'Identifiant invalide.' };
  }

  // Owner-scoped lookup: guessing a membership id from another workspace
  // resolves to null here rather than leaking or acting on it.
  const member = await getMemberForOwner(user.id, parsed.data);
  if (!member) {
    return { error: 'Membre introuvable.' };
  }

  // The reset token is keyed by EMAIL (PasswordResetToken.email), and email is
  // also the only login identifier the credentials provider accepts, so a member
  // without one cannot be reset — or signed in — at all.
  if (!member.email) {
    return {
      error:
        "Ce collaborateur n'a pas d'adresse e-mail enregistrée : impossible de réinitialiser son mot de passe.",
    };
  }

  let token: string;
  try {
    const created = await generatePasswordResetToken(member.email);
    token = created.token;
  } catch {
    return { error: 'Impossible de générer le lien de réinitialisation.' };
  }

  const link = buildPasswordResetLink(token);

  // Best-effort send, but report the TRUTH: sendPasswordResetEmail returns false
  // when Resend is unconfigured or replies with an error, so the owner is never
  // told an email went out when it didn't.
  const emailed = await sendPasswordResetEmail(
    member.name,
    member.email,
    token
  );

  return {
    success: emailed
      ? `Lien de réinitialisation envoyé à ${member.email}.`
      : 'Lien de réinitialisation généré. Transmettez-le à votre collaborateur.',
    link,
    email: member.email,
    emailed,
  };
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
): Promise<{ error: string } | { success: string; redirectTo: string }> {
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

  return {
    success: 'Vous avez rejoint l\'espace de travail.',
    // Derived from the permissions the owner actually granted. The client used
    // to hardcode '/performances', which is permission-gated, so a member
    // without that permission was dropped on a page the guard then bounced them
    // out of. `memberLandingHref` returns their first allowed area, or
    // /settings, which every member can reach.
    redirectTo: memberLandingHref(result.permissions),
  };
}


/**
 * Invite-without-account (#13): a person WITHOUT an account creates one from an
 * invite link and is immediately attached to the inviting workspace.
 *
 * The account is created EMAIL-VERIFIED so they can sign in right away (no email
 * round-trip), then the invitation is consumed atomically to create the
 * membership. On success the client signs the user in with the same
 * credentials. Never leaks whether the email exists beyond a generic message.
 */
export async function signUpAndJoin(
  values: z.infer<typeof SignUpAndJoinSchema>
): Promise<
  { error: string } | { success: string; email: string; redirectTo: string }
> {
  const parsed = SignUpAndJoinSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? 'Données invalides.',
    };
  }

  const { code, name, email, phone, password } = parsed.data;

  // Check the code BEFORE creating anything. The redeem below re-validates
  // atomically (this is only a fast path), but without it a mistyped code meant
  // creating a user row and then deleting it again on every attempt.
  const invitation = await findValidInvitationByCode(code);
  if (!invitation) {
    return { error: redeemReasonToMessage('invalid') };
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return {
      error:
        'Un compte existe déjà avec cet e-mail. Connectez-vous puis utilisez votre code.',
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let userId: string;
  try {
    const created = await db.user.create({
      data: {
        name,
        email,
        phone: phone?.trim() || null,
        password: hashedPassword,
        // Trusted invite flow → verified so they can log in immediately.
        emailVerified: new Date(),
        // Members don't onboard (they can't create restaurants).
        onboardedAt: new Date(),
      },
      select: { id: true },
    });
    userId = created.id;
  } catch {
    return { error: 'Impossible de créer le compte.' };
  }

  // Attach to the inviting workspace (atomic, re-checks all invariants).
  const result = await consumeInvitationAndCreateMembership(code, userId);
  if (!result.ok) {
    // Roll back the just-created account so a bad/expired code doesn't leave a
    // dangling, unattached user.
    try {
      await db.user.delete({ where: { id: userId } });
    } catch {
      // ignore cleanup failure
    }
    return { error: redeemReasonToMessage(result.reason) };
  }

  // The phone is now stored on the account itself (User.phone, set above). Also
  // mirror it onto the invitation, which is the OWNER-visible record of who they
  // invited — the owner's team screen reads the invitation, not the member's
  // account. Only when the owner didn't already prefill one. Best-effort: never
  // fail the join over this.
  if (phone?.trim() && !invitation.inviteePhone) {
    try {
      await db.invitation.updateMany({
        where: { id: invitation.id, usedByUserId: userId },
        data: { inviteePhone: phone.trim() },
      });
    } catch {
      // ignore
    }
  }

  return {
    success: 'Compte créé et rattaché à l’espace.',
    email,
    // See joinWorkspace: never hardcode /performances for a member.
    redirectTo: memberLandingHref(result.permissions),
  };
}
