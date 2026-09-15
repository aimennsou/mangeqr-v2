'use server';

import { db } from '@/lib/db';
import { currentUserId } from '@/lib/authentication';

/**
 * Mark the current user's first-login onboarding as complete by stamping
 * `onboardedAt`. Idempotent: re-calling on an already-onboarded account is a
 * no-op (we don't overwrite the original timestamp). After this, sign-in routes
 * the user to /performances instead of /onboarding.
 */
export async function completeOnboarding(): Promise<{ success: boolean }> {
  const userId = await currentUserId();
  if (!userId) {
    return { success: false };
  }

  try {
    await db.user.updateMany({
      where: { id: userId, onboardedAt: null },
      data: { onboardedAt: new Date() }
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
