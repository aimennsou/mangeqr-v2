'use server';

import { type ReactElement } from 'react';
import { Resend } from 'resend';
import { type z } from 'zod';


import { ContactFormSchema } from '@/lib/schemas';
import { db } from '@/lib/db';
import EmailTemplate from '@/components/emails/contact-email';

export async function sendEmail(data: z.infer<typeof ContactFormSchema>) {
  try {
    const result = ContactFormSchema.safeParse(data);
    if (!result.success) {
      return { error: 'Invalid form data' };
    }

    const { name, email, message } = result.data;

    // Persist the message so the superadmin support inbox can triage it. This
    // is the durable record; email delivery below is best-effort. A DB failure
    // here shouldn't lose the message, but we surface it if nothing worked.
    let persisted = false;
    try {
      await db.supportMessage.create({ data: { name, email, message } });
      persisted = true;
    } catch (dbErr) {
      console.error('[send-email] failed to persist support message', dbErr);
    }

    // Best-effort email notification (optional — inbox is the source of truth).
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: 'Pricing page message <contact@mangeqr.com>',
          to: email,
          subject: `New Contact Form Message from ${name}`,
          react: EmailTemplate({ name, email, message }) as ReactElement,
        });
      } catch (mailErr) {
        console.error('[send-email] Resend send failed', mailErr);
        // Don't fail the whole request if the message was saved.
        if (!persisted) return { error: 'Failed to send message' };
      }
    } else {
      console.warn('[send-email] RESEND_API_KEY not set — message saved, email skipped.');
    }

    if (!persisted && !apiKey) {
      return { error: 'Message service is not configured.' };
    }

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to send message' };
  }
}
