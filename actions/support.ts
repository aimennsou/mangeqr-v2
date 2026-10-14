'use server';

import { type z } from 'zod';

import { db } from '@/lib/db';
import { currentUser } from '@/lib/authentication';
import { SupportMessageSchema, SupportReplySchema } from '@/schemas';
import EmailTemplate from '@/components/emails/contact-email';
import { sendMail, getSupportInbox, isEmailConfigured } from '@/lib/email';

/**
 * Send an in-app support message from an authenticated user.
 *
 * Persists to the SupportMessage table (the durable record surfaced in the
 * superadmin support inbox) and best-effort emails the team via Resend. The
 * message is tagged with the sender's name/email; a short marker is appended so
 * the superadmin can tell in-app messages from landing contact-form ones.
 *
 * Returns `{ error }` / `{ success }` per the project convention.
 */
export async function sendSupportMessage(
  values: z.infer<typeof SupportMessageSchema>
) {
  const user = await currentUser();
  if (!user?.id) {
    return { error: 'Non autorisé.' };
  }

  const parsed = SupportMessageSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Message invalide.' };
  }

  const { name, email, message } = parsed.data;

  let persisted = false;
  try {
    await db.supportMessage.create({
      // Attach the author so they can see this ticket in their support history.
      data: { userId: user.id, name, email, message }
    });
    persisted = true;
  } catch (dbErr) {
    console.error('[support] failed to persist support message', dbErr);
  }

  // Best-effort email notification. The message is DELIVERED TO THE SUPPORT
  // INBOX (not back to the sender); reply_to is the sender so the team can
  // reply directly. The DB record remains the source of truth.
  const configured = isEmailConfigured();
  if (configured) {
    const sent = await sendMail({
      from: 'support',
      to: getSupportInbox(),
      replyTo: email,
      subject: `Support — message de ${name}`,
      react: EmailTemplate({ name, email, message }),
    });
    if (!sent && !persisted) {
      return { error: 'Échec de l’envoi du message.' };
    }
  }

  if (!persisted && !configured) {
    return { error: 'Le service de support n’est pas configuré.' };
  }

  return {
    success: 'Votre message a été envoyé. Notre équipe vous répondra bientôt.'
  };
}


/**
 * Post a user reply to one of THEIR OWN support tickets. Scoped strictly to the
 * authenticated user (the ticket must have their userId). Adds a USER reply and
 * flips the ticket back to NEW so the superadmin sees it needs attention again.
 * A resolved ticket cannot be replied to (closed).
 */
export async function userReplyToTicket(
  values: z.infer<typeof SupportReplySchema>
) {
  const user = await currentUser();
  if (!user?.id) {
    return { error: 'Non autorisé.' };
  }

  const parsed = SupportReplySchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Réponse invalide.' };
  }

  const { ticketId, body } = parsed.data;

  const ticket = await db.supportMessage.findFirst({
    where: { id: ticketId, userId: user.id },
    select: { id: true, status: true }
  });
  if (!ticket) {
    return { error: 'Demande introuvable.' };
  }
  if (ticket.status === 'RESOLVED') {
    return { error: 'Cette demande est clôturée.' };
  }

  try {
    await db.$transaction([
      db.supportReply.create({
        data: {
          ticketId,
          authorRole: 'USER',
          authorName: user.name ?? null,
          body
        }
      }),
      // A new user reply reopens the conversation for the support team.
      db.supportMessage.update({
        where: { id: ticketId },
        data: { status: 'NEW' }
      })
    ]);
  } catch {
    return { error: 'Impossible d’envoyer la réponse.' };
  }

  return { success: 'Réponse envoyée.' };
}
