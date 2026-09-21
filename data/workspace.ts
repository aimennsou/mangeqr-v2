import crypto from 'crypto';

import { db } from '@/lib/db';
import { getEffectivePlan, getPlanLimits, isTrialExpired } from '@/lib/plan';
import {
  parsePermissions,
  type MemberPermission,
} from '@/lib/permissions';
import type { Invitation, WorkspaceRole } from '@prisma/client';

/**
 * Workspace data layer (server-only reads/helpers).
 *
 * A "workspace" is rooted at an OWNER user (the one who owns Restaurants).
 * Other users become MEMBERS by redeeming an invite; a `Membership` links a
 * `memberUserId` to that owner. A user is a member of AT MOST ONE workspace
 * (enforced by `Membership.memberUserId @unique`).
 *
 * Scoping rule: menu/categorie/plat access is scoped to the workspace OWNER's
 * id via `getWorkspaceOwnerId`, so members act on the owner's data. This module
 * is the single source of truth for that resolution.
 *
 * These are plain server functions (no 'use server' — they are reads/helpers,
 * not Server Actions) and must never be imported into client components.
 */

// ---------------------------------------------------------------------------
// Workspace resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the workspace owner id for a given user.
 *
 * SINGLE SOURCE OF TRUTH for scoping menu/categorie/plat access: members act on
 * the owner's data. If the user is a member (has a `Membership` as
 * `memberUserId`), return the membership's `ownerUserId`; otherwise the user is
 * their own workspace owner and we return their id.
 */
export async function getWorkspaceOwnerId(userId: string): Promise<string> {
  try {
    const membership = await db.membership.findUnique({
      where: { memberUserId: userId },
      select: { ownerUserId: true },
    });
    return membership?.ownerUserId ?? userId;
  } catch {
    // On any lookup failure, fall back to treating the user as their own owner.
    return userId;
  }
}

/**
 * Resolve the workspace owner id AND the caller's role in one lookup.
 * - member  → `{ ownerId: membership.ownerUserId, role: 'MEMBER' }`
 * - not     → `{ ownerId: userId, role: 'OWNER' }`
 */
export async function getWorkspaceContext(
  userId: string
): Promise<{
  ownerId: string;
  role: 'OWNER' | 'MEMBER';
  permissions: MemberPermission[] | null;
}> {
  try {
    const membership = await db.membership.findUnique({
      where: { memberUserId: userId },
      select: { ownerUserId: true, permissions: true },
    });
    if (membership) {
      return {
        ownerId: membership.ownerUserId,
        role: 'MEMBER',
        permissions: parsePermissions(membership.permissions),
      };
    }
  } catch {
    // fall through to owner default
  }
  // Owners implicitly have every permission.
  return { ownerId: userId, role: 'OWNER', permissions: null };
}

/**
 * Whether the workspace OWNER's FREE trial has expired. Resolves the caller to
 * their owner and checks the owner's plan/expiry. Used to hard-block mutations
 * (menu/dish/category edits, etc.) once the trial ends. Never throws.
 */
export async function isWorkspaceTrialExpired(
  userId: string
): Promise<boolean> {
  try {
    const ownerId = await getWorkspaceOwnerId(userId);
    const owner = await db.user.findUnique({
      where: { id: ownerId },
      select: { plan: true, planRenewsAt: true },
    });
    if (!owner) return false;
    return isTrialExpired({ plan: owner.plan, planRenewsAt: owner.planRenewsAt });
  } catch {
    return false;
  }
}

/**
 * Whether the workspace OWNER's account has ordering enabled (FEAT-1/D16). The
 * superadmin flips `User.orderingEnabled` per account; this resolves the caller
 * to their owner and reads that flag. UX/nav gating only — server routes and
 * the diner order endpoints re-check authoritatively.
 */
export async function isOrderingEnabledForUser(
  userId: string
): Promise<boolean> {
  try {
    const ownerId = await getWorkspaceOwnerId(userId);
    const owner = await db.user.findUnique({
      where: { id: ownerId },
      select: { orderingEnabled: true }
    });
    return owner?.orderingEnabled ?? false;
  } catch {
    return false;
  }
}

/** True when the user is a member of some workspace (has a Membership row). */
export async function isWorkspaceMember(userId: string): Promise<boolean> {
  try {
    const membership = await db.membership.findUnique({
      where: { memberUserId: userId },
      select: { id: true },
    });
    return membership !== null;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export interface WorkspaceMember {
  membershipId: string;
  memberId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  permissions: MemberPermission[];
  createdAt: Date;
}

/** List the members of an owner's workspace with basic user info. */
export async function listMembers(ownerId: string): Promise<WorkspaceMember[]> {
  try {
    const memberships = await db.membership.findMany({
      where: { ownerUserId: ownerId },
      orderBy: { createdAt: 'asc' },
      include: {
        member: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      memberId: m.member.id,
      name: m.member.name,
      email: m.member.email,
      image: m.member.image,
      permissions: parsePermissions(m.permissions),
      createdAt: m.createdAt,
    }));
  } catch {
    return [];
  }
}

/**
 * Update a member's permissions. Owner-scoped: only affects a membership owned
 * by `ownerId`. Returns true when a row was updated.
 */
export async function updateMemberPermissions(
  ownerId: string,
  membershipId: string,
  permissions: MemberPermission[]
): Promise<boolean> {
  try {
    const res = await db.membership.updateMany({
      where: { id: membershipId, ownerUserId: ownerId },
      data: { permissions: permissions as unknown as object },
    });
    return res.count > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Member activity journal
// ---------------------------------------------------------------------------

export interface WorkspaceActivityRow {
  id: string;
  actorUserId: string;
  actorName: string | null;
  action: string;
  summary: string;
  createdAt: Date;
}

/**
 * Log a member action for the owner's activity journal. Best-effort: never
 * throws (a journal write must not break the primary mutation). Owner actions
 * are skipped (only members are journaled).
 */
export async function logWorkspaceActivity(args: {
  ownerId: string;
  actorUserId: string;
  actorName?: string | null;
  action: string;
  summary: string;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await db.workspaceActivity.create({
      data: {
        ownerUserId: args.ownerId,
        actorUserId: args.actorUserId,
        actorName: args.actorName ?? null,
        action: args.action,
        summary: args.summary,
        metadata: (args.metadata ?? undefined) as object | undefined,
      },
    });
  } catch {
    // ignore
  }
}

/**
 * Convenience: log an activity for the given actor IF they are a workspace
 * MEMBER (owner actions are not journaled). Resolves the owner + actor name.
 * Best-effort; never throws. Call from owner-scoped mutation routes/actions
 * with the authenticated user id.
 */
export async function logMemberActivity(
  actorUserId: string,
  action: string,
  summary: string,
  metadata?: Record<string, unknown> | null
): Promise<void> {
  try {
    const membership = await db.membership.findUnique({
      where: { memberUserId: actorUserId },
      select: { ownerUserId: true },
    });
    // Only members are journaled (owner acting on their own data is skipped).
    if (!membership) return;
    const actor = await db.user.findUnique({
      where: { id: actorUserId },
      select: { name: true, email: true },
    });
    await logWorkspaceActivity({
      ownerId: membership.ownerUserId,
      actorUserId,
      actorName: actor?.name ?? actor?.email ?? null,
      action,
      summary,
      metadata,
    });
  } catch {
    // ignore
  }
}

/** List the workspace activity journal for an owner, newest first. */
export async function listWorkspaceActivity(
  ownerId: string,
  opts?: { actorUserId?: string; take?: number }
): Promise<WorkspaceActivityRow[]> {
  try {
    const rows = await db.workspaceActivity.findMany({
      where: {
        ownerUserId: ownerId,
        ...(opts?.actorUserId ? { actorUserId: opts.actorUserId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: opts?.take ?? 100,
      select: {
        id: true,
        actorUserId: true,
        actorName: true,
        action: true,
        summary: true,
        createdAt: true,
      },
    });
    return rows;
  } catch {
    return [];
  }
}

/** Count active memberships owned by `ownerId`. */
export async function countActiveMembers(ownerId: string): Promise<number> {
  try {
    return await db.membership.count({ where: { ownerUserId: ownerId } });
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Seat capacity
// ---------------------------------------------------------------------------

/**
 * Whether the owner can add another member right now. Seats are computed from
 * the owner's EFFECTIVE plan (expired paid plans collapse to STARTER → 0 seats).
 * `used` counts active memberships only; pending invites do not reserve seats
 * (the seat is (re)checked atomically at redeem time — see
 * `consumeInvitationAndCreateMembership`).
 */
export async function canAddMember(
  ownerId: string
): Promise<{ ok: boolean; used: number; limit: number }> {
  const [owner, used] = await Promise.all([
    db.user.findUnique({
      where: { id: ownerId },
      select: { plan: true, planRenewsAt: true },
    }),
    countActiveMembers(ownerId),
  ]);

  const limit = getPlanLimits(getEffectivePlan(owner ?? {})).seats;
  return { ok: used < limit, used, limit };
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

/** Unambiguous base32 alphabet (no 0/O/1/I/L confusables). */
const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;

/**
 * Generate a short, unguessable, human-friendly invite code: 8 uppercase
 * characters drawn uniformly from an unambiguous base32 alphabet using Node's
 * CSPRNG (`crypto.randomInt`).
 */
export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_ALPHABET[crypto.randomInt(INVITE_ALPHABET.length)];
  }
  return code;
}

/**
 * Create a pending invitation for `ownerId`. Generates a unique code (retrying
 * on the rare unique-collision), role MEMBER, expiring in `expiresInDays`
 * (default 7). Seat-limit enforcement lives in the ACTION layer (T6); this only
 * persists the invite.
 */
export async function createInvitation(
  ownerId: string,
  opts?: {
    expiresInDays?: number;
    inviteeName?: string | null;
    inviteeEmail?: string | null;
    inviteePhone?: string | null;
    label?: string | null;
    permissions?: MemberPermission[] | null;
  }
): Promise<Invitation> {
  const days = opts?.expiresInDays ?? 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const maxAttempts = 3;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await db.invitation.create({
        data: {
          ownerUserId: ownerId,
          code: generateInviteCode(),
          role: 'MEMBER',
          expiresAt,
          inviteeName: opts?.inviteeName ?? null,
          inviteeEmail: opts?.inviteeEmail ?? null,
          inviteePhone: opts?.inviteePhone ?? null,
          label: opts?.label ?? null,
          ...(opts?.permissions
            ? { permissions: opts.permissions as unknown as object }
            : {}),
        },
      });
    } catch (err) {
      // Retry only on the (very rare) unique-code collision; otherwise rethrow.
      lastError = err;
    }
  }
  throw lastError ?? new Error('Failed to create invitation');
}

/**
 * Public view of an invitation for the join/sign-up landing (#13): resolves the
 * owner label + the invitee's pre-filled contact, WITHOUT exposing internals.
 * Returns null if the code is invalid/expired/used.
 */
export interface PublicInviteInfo {
  code: string;
  ownerName: string | null;
  label: string | null;
  inviteeName: string | null;
  inviteeEmail: string | null;
  inviteePhone: string | null;
}

export async function getPublicInviteByCode(
  code: string
): Promise<PublicInviteInfo | null> {
  const invitation = await findValidInvitationByCode(code);
  if (!invitation) return null;
  try {
    const owner = await db.user.findUnique({
      where: { id: invitation.ownerUserId },
      select: { name: true },
    });
    return {
      code: invitation.code,
      ownerName: owner?.name ?? null,
      label: invitation.label,
      inviteeName: invitation.inviteeName,
      inviteeEmail: invitation.inviteeEmail,
      inviteePhone: invitation.inviteePhone,
    };
  } catch {
    return null;
  }
}

export interface InvitationSummary {
  id: string;
  code: string;
  role: WorkspaceRole;
  expiresAt: Date | null;
  usedByUserId: string | null;
  usedAt: Date | null;
  createdAt: Date;
}

/**
 * List an owner's invitations. Returns the PENDING ones (unused and not
 * expired), newest first — the shape the team UI needs.
 */
export async function listInvitations(
  ownerId: string
): Promise<InvitationSummary[]> {
  try {
    const invitations = await db.invitation.findMany({
      where: {
        ownerUserId: ownerId,
        usedByUserId: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((i) => ({
      id: i.id,
      code: i.code,
      role: i.role,
      expiresAt: i.expiresAt,
      usedByUserId: i.usedByUserId,
      usedAt: i.usedAt,
      createdAt: i.createdAt,
    }));
  } catch {
    return [];
  }
}

/**
 * Look up a redeemable invitation by code (compared uppercase, so matching is
 * effectively case-insensitive since codes are stored uppercase). Returns the
 * invite only if it is unused AND not expired; otherwise null.
 */
export async function findValidInvitationByCode(
  code: string
): Promise<Invitation | null> {
  try {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return null;

    const invitation = await db.invitation.findUnique({
      where: { code: normalized },
    });
    if (!invitation) return null;
    if (invitation.usedByUserId) return null;
    if (invitation.expiresAt && invitation.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    return invitation;
  } catch {
    return null;
  }
}

/**
 * Revoke a PENDING (unused) invitation belonging to `ownerId`. Scoped by
 * `ownerUserId` so an owner can only affect their own invites. Returns true when
 * a row was deleted.
 */
export async function revokeInvitation(
  ownerId: string,
  invitationId: string
): Promise<boolean> {
  try {
    const result = await db.invitation.deleteMany({
      where: { id: invitationId, ownerUserId: ownerId, usedByUserId: null },
    });
    return result.count > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Membership removal
// ---------------------------------------------------------------------------

/**
 * Remove a membership belonging to `ownerId`, revoking that member's access
 * immediately. Scoped by `ownerUserId` so an owner can only remove members of
 * their own workspace. Returns true when a row was deleted.
 */
export async function removeMember(
  ownerId: string,
  membershipId: string
): Promise<boolean> {
  try {
    const result = await db.membership.deleteMany({
      where: { id: membershipId, ownerUserId: ownerId },
    });
    return result.count > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Transactional redeem (kept here so T6's action layer stays thin)
// ---------------------------------------------------------------------------

export type RedeemResult =
  | { ok: true; ownerId: string }
  | {
      ok: false;
      reason:
        | 'invalid'
        | 'self'
        | 'already_member'
        | 'owns_team'
        | 'owns_restaurants'
        | 'seat_full';
    };

/**
 * Atomically consume an invitation and create the membership.
 *
 * Runs inside `db.$transaction`, re-checking every invariant INSIDE the tx to
 * guard against races (two redeemers, seat filling up, invite expiring):
 *   1. invite still exists, unused, and not expired,
 *   2. the owner's seat limit is not full,
 *   3. redeemer guard rules (below) still hold,
 * then creates the `Membership` and stamps `usedByUserId`/`usedAt` on the invite
 * (one-time consumption).
 *
 * Redeemer guard rules (R1: a user is either an OWNER or a MEMBER):
 *   - `self`             → cannot join your own workspace (redeemer === invite owner),
 *   - `already_member`   → already a member of some workspace (memberUserId unique),
 *   - `owns_team`        → already runs their own team (has ownedMemberships),
 *   - `owns_restaurants` → owns Restaurant(s); joining would orphan their data
 *                          under a foreign workspace (rejected in v1).
 */
export async function consumeInvitationAndCreateMembership(
  code: string,
  memberUserId: string
): Promise<RedeemResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, reason: 'invalid' };

  try {
    return await db.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { code: normalized },
      });
      if (!invitation) return { ok: false, reason: 'invalid' } as const;
      if (invitation.usedByUserId) {
        return { ok: false, reason: 'invalid' } as const;
      }
      if (
        invitation.expiresAt &&
        invitation.expiresAt.getTime() <= Date.now()
      ) {
        return { ok: false, reason: 'invalid' } as const;
      }

      const ownerId = invitation.ownerUserId;

      // Guard: cannot join your own workspace.
      if (ownerId === memberUserId) {
        return { ok: false, reason: 'self' } as const;
      }

      // Guard: redeemer must not already be a member of a workspace.
      const existingMembership = await tx.membership.findUnique({
        where: { memberUserId },
        select: { id: true },
      });
      if (existingMembership) {
        return { ok: false, reason: 'already_member' } as const;
      }

      // Guard: redeemer must not already run their own team.
      const ownedCount = await tx.membership.count({
        where: { ownerUserId: memberUserId },
      });
      if (ownedCount > 0) {
        return { ok: false, reason: 'owns_team' } as const;
      }

      // Guard: redeemer must not own restaurants (would orphan their data).
      const restaurantCount = await tx.restaurant.count({
        where: { userId: memberUserId },
      });
      if (restaurantCount > 0) {
        return { ok: false, reason: 'owns_restaurants' } as const;
      }

      // Seat check against the owner's EFFECTIVE plan, re-evaluated in-tx.
      const owner = await tx.user.findUnique({
        where: { id: ownerId },
        select: { plan: true, planRenewsAt: true },
      });
      const limit = getPlanLimits(getEffectivePlan(owner ?? {})).seats;
      const used = await tx.membership.count({
        where: { ownerUserId: ownerId },
      });
      if (used >= limit) {
        return { ok: false, reason: 'seat_full' } as const;
      }

      // Create membership + consume the invite atomically, carrying over the
      // permissions the owner chose at invite time (default set when unset).
      const invitePermissions = parsePermissions(invitation.permissions);
      await tx.membership.create({
        data: {
          ownerUserId: ownerId,
          memberUserId,
          role: 'MEMBER',
          permissions: invitePermissions as unknown as object,
        },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { usedByUserId: memberUserId, usedAt: new Date() },
      });

      return { ok: true, ownerId } as const;
    });
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
