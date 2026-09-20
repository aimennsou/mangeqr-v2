import type { NotificationType } from '@prisma/client';

import { db } from '@/lib/db';

/**
 * In-app notification helpers (#14).
 *
 * A single place to create notifications so every source (support replies,
 * design/menu order status changes, admin broadcasts) writes them the same way.
 * Failures are swallowed — a notification must never break the primary action
 * that triggered it.
 */

interface CreateNotificationArgs {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  entityId?: string | null;
}

/** Create a single notification for a user. Never throws. */
export async function createNotification(
  args: CreateNotificationArgs,
): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: args.userId,
        type: args.type,
        title: args.title,
        body: args.body ?? null,
        link: args.link ?? null,
        entityId: args.entityId ?? null,
      },
    });
  } catch {
    // Best-effort: ignore.
  }
}

/**
 * Broadcast a notification to many users at once (admin message). Skips silently
 * on failure. `userIds` empty => no-op.
 */
export async function createBroadcastNotifications(
  userIds: string[],
  title: string,
  body?: string | null,
  link?: string | null,
): Promise<number> {
  if (userIds.length === 0) return 0;
  try {
    const res = await db.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: 'BROADCAST' as NotificationType,
        title,
        body: body ?? null,
        link: link ?? null,
      })),
    });
    return res.count;
  } catch {
    return 0;
  }
}

/** Count unread notifications for a user. */
export async function countUnreadNotifications(userId: string): Promise<number> {
  try {
    return await db.notification.count({
      where: { userId, readAt: null },
    });
  } catch {
    return 0;
  }
}

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}

/** List a user's notifications, newest first. */
export async function listNotifications(
  userId: string,
  take = 20,
): Promise<NotificationRow[]> {
  try {
    return await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        readAt: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}
