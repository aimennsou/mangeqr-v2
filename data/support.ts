import { db } from '@/lib/db';
import type {
  SupportMessageStatus,
  SupportAuthorRole
} from '@prisma/client';

/**
 * Support ticket data layer (server-only reads). Tickets are the user's own
 * support threads (SupportMessage rows with their userId), including the full
 * reply conversation. Scoped strictly to the authenticated user — a user can
 * only ever read their own tickets.
 */

export interface SupportTicketReply {
  id: string;
  authorRole: SupportAuthorRole;
  authorName: string | null;
  body: string;
  createdAt: Date;
}

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  message: string;
  status: SupportMessageStatus;
  createdAt: Date;
  updatedAt: Date;
  replies: SupportTicketReply[];
}

const REPLY_SELECT = {
  orderBy: { createdAt: 'asc' as const },
  select: {
    id: true,
    authorRole: true,
    authorName: true,
    body: true,
    createdAt: true
  }
};

/** List a user's own support tickets, newest first, with replies. */
export async function listSupportTicketsForUser(
  userId: string
): Promise<SupportTicket[]> {
  try {
    const rows = await db.supportMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        replies: REPLY_SELECT
      }
    });
    return rows;
  } catch {
    return [];
  }
}

/**
 * Fetch a single ticket by id, scoped to the owning user. Returns null when the
 * ticket doesn't exist or belongs to someone else (so foreign ids stay opaque).
 */
export async function getSupportTicketForUser(
  id: string,
  userId: string
): Promise<SupportTicket | null> {
  try {
    return await db.supportMessage.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        replies: REPLY_SELECT
      }
    });
  } catch {
    return null;
  }
}
