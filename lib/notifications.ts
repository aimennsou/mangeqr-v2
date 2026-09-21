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


/**
 * Notify on a plan-limit hit (#4). When a (free/paid) account hits a resource
 * cap, we let the OWNER know (nudge to upgrade → /settings) and alert every
 * SUPERADMIN so the back-office can reach out. Best-effort; never throws.
 *
 * De-duped per (owner, resource) within a short window so repeated blocked
 * attempts don't spam the inbox.
 *
 * @param resource   Human label of what was capped (e.g. "restaurants", "menus").
 * @param limit      The account's limit for that resource.
 */
export async function notifyPlanLimitHit(args: {
  ownerId: string;
  resource: string;
  limit: number;
}): Promise<void> {
  const { ownerId, resource, limit } = args;
  try {
    // Skip if we already notified this owner about this resource in the last
    // 24h (avoid spamming on repeated blocked attempts).
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await db.notification.findFirst({
      where: {
        userId: ownerId,
        type: 'PLAN_LIMIT' as NotificationType,
        entityId: resource,
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (recent) return;

    const owner = await db.user.findUnique({
      where: { id: ownerId },
      select: { name: true, email: true },
    });
    const who = owner?.name ?? owner?.email ?? 'Un compte';

    // Owner nudge.
    await createNotification({
      userId: ownerId,
      type: 'PLAN_LIMIT' as NotificationType,
      title: 'Limite de votre forfait atteinte',
      body: `Vous avez atteint la limite de ${limit} ${resource}. Passez à un forfait supérieur pour en ajouter davantage.`,
      link: '/settings',
      entityId: resource,
    });

    // Back-office alert.
    const admins = await db.user.findMany({
      where: { role: 'SUPERADMIN' },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) =>
        createNotification({
          userId: a.id,
          type: 'PLAN_LIMIT' as NotificationType,
          title: 'Compte à la limite de son forfait',
          body: `${who} a atteint la limite de ${limit} ${resource}.`,
          link: '/superadmin/users',
          entityId: resource,
        }),
      ),
    );
  } catch {
    // Best-effort: ignore.
  }
}
