import { NextResponse } from 'next/server';

import { currentUserId } from '@/lib/authentication';
import {
  countUnreadNotifications,
  listNotifications,
} from '@/lib/notifications';

/**
 * GET /api/notifications
 * Returns the current user's notifications (newest first) and the unread count.
 * Auth-scoped: only the signed-in user's own notifications.
 */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    listNotifications(userId, 20),
    countUnreadNotifications(userId),
  ]);

  return NextResponse.json({ items, unread });
}
