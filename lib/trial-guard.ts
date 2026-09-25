import { NextResponse } from 'next/server';

import { isWorkspaceTrialExpired, memberCanAccess } from '@/data/workspace';
import type { MemberPermission } from '@/lib/permissions';

/**
 * Server-side hard gate for owner-scoped MUTATIONS during an expired FREE trial.
 *
 * Returns a 403 NextResponse when the caller's workspace owner's free trial has
 * ended, otherwise `null` (proceed). Call this in the create/update/delete
 * handlers of owner-scoped API routes, right after resolving the caller — so a
 * trial-expired owner cannot edit data even by hitting the API directly (the
 * UI is already covered by the in-app lock overlay).
 */
export async function blockIfTrialExpired(
  userId: string,
): Promise<NextResponse | null> {
  if (await isWorkspaceTrialExpired(userId)) {
    return NextResponse.json(
      {
        error:
          "Votre essai gratuit est terminé. Passez au forfait Starter pour continuer.",
      },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Server-side gate for the granular per-member permissions (see
 * `lib/permissions.ts`).
 *
 * Returns a 403 NextResponse when the caller is a workspace MEMBER who has NOT
 * been granted `permission`, otherwise `null` (proceed). Owners always pass.
 *
 * Use this in owner-scoped API routes alongside `blockIfTrialExpired`. Resolving
 * the workspace owner (`getWorkspaceOwnerId`) is NOT an authorization check — it
 * only decides whose data is being touched, so a member with the `orders`
 * permission alone could otherwise still create, edit and delete menus,
 * categories and dishes by calling those endpoints directly.
 */
export async function blockIfNoPermission(
  userId: string,
  permission: MemberPermission,
): Promise<NextResponse | null> {
  if (!(await memberCanAccess(userId, permission))) {
    return NextResponse.json(
      { error: "Vous n'avez pas la permission d'effectuer cette action." },
      { status: 403 },
    );
  }
  return null;
}
