'use server';

import { type ReactElement } from 'react';
import { Resend } from 'resend';
import { type z } from 'zod';


import { ContactFormSchema } from '@/lib/schemas';
import EmailTemplate from '@/components/emails/contact-email';

export async function sendEmail(data: z.infer<typeof ContactFormSchema>) {
  try {
    const result = ContactFormSchema.safeParse(data);
    if (!result.success) {
      return { error: 'Invalid form data' };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[send-email] RESEND_API_KEY is not set — skipping email send.');
      return { error: 'Email service is not configured.' };
    }
    const resend = new Resend(apiKey);

    const { name, email, message } = result.data;

    const { error } = await resend.emails.send({
      from: 'Pricing page message <contact@mangeqr.com>',
      to: email,
    
      subject: `New Contact Form Message from ${name}`,
      react: EmailTemplate({ name, email, message }) as ReactElement,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to send email' };
  }
}
