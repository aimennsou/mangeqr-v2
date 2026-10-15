'use server';

import { currentUserId } from '@/lib/authentication';
import { db } from '@/lib/db';

/**
 * User-scoped notification mutations (#14). Every action operates ONLY on the
 * signed-in user's own notifications.
 */

type Result = { error?: string; success?: boolean };

/** Mark one notification read (must belong to the current user). */
export async function markNotificationRead(id: string): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { error: 'Non autorisé.' };
  try {
    await db.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  } catch {
    return { error: 'Impossible de mettre à jour la notification.' };
  }
}

/** Mark all of the current user's notifications read. */
export async function markAllNotificationsRead(): Promise<Result> {
  const userId = await currentUserId();
  if (!userId) return { error: 'Non autorisé.' };
  try {
    await db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  } catch {
    return { error: 'Impossible de mettre à jour les notifications.' };
  }
}
