import { NextResponse } from 'next/server';

import { isWorkspaceTrialExpired } from '@/data/workspace';

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
