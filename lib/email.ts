/**
 * Email core — the single place that talks to Resend.
 *
 * Every email the app sends (auth: verification / reset / 2FA / team invite;
 * support + contact-form notifications; marketing campaigns) goes through
 * `sendMail()` here. Centralizing it means:
 *   • one lazy Resend client (constructing it with no key throws),
 *   • one place that reads the configurable sending domain,
 *   • one consistent "did it actually send?" contract (Resend reports failures
 *     in the response body, NOT by throwing, so we must inspect `error`).
 *
 * ----------------------------------------------------------------------------
 * Production setup — plug in and go:
 *   RESEND_API_KEY      required. From https://resend.com.
 *   EMAIL_FROM_DOMAIN   the VERIFIED sending domain, e.g. "mangeqr.com".
 *                       All from-addresses are built on this domain, so pointing
 *                       it at your own verified domain is all it takes to switch.
 *                       Defaults to "mangeqr.com".
 *   SUPPORT_INBOX_EMAIL where contact-form / support messages are delivered,
 *                       e.g. "support@mangeqr.com". Defaults to
 *                       "contact@<EMAIL_FROM_DOMAIN>".
 *
 * When RESEND_API_KEY is unset (local dev / mock data), sends are skipped
 * gracefully and `sendMail` returns false — imports never crash.
 * ----------------------------------------------------------------------------
 */

import { Resend } from 'resend';
import { type ReactElement } from 'react';

// ---------------------------------------------------------------------------
// Configuration (env-driven)
// ---------------------------------------------------------------------------

/** The verified domain all from-addresses are built on. */
export function getFromDomain(): string {
  return (process.env.EMAIL_FROM_DOMAIN || 'mangeqr.com').trim().toLowerCase();
}

/**
 * Named sender identities. Each is a local-part on the sending domain plus a
 * human-friendly display name. Build the full "Name <local@domain>" string via
 * `fromAddress()`.
 */
export const SENDERS = {
  confirmation: { local: 'confirmation', name: 'MangeQR' },
  reset: { local: 'reset', name: 'MangeQR' },
  twoFactor: { local: '2fa', name: 'MangeQR' },
  team: { local: 'equipe', name: 'MangeQR' },
  contact: { local: 'contact', name: 'MangeQR' },
  support: { local: 'contact', name: 'Support MangeQR' },
  marketing: { local: 'contact', name: 'MangeQR' },
} as const;

export type SenderKey = keyof typeof SENDERS;

/** Build a `Name <local@domain>` from-address for a named sender. */
export function fromAddress(key: SenderKey): string {
  const { local, name } = SENDERS[key];
  return `${name} <${local}@${getFromDomain()}>`;
}

/** The inbox that receives contact-form and support messages. */
export function getSupportInbox(): string {
  return (
    process.env.SUPPORT_INBOX_EMAIL || `contact@${getFromDomain()}`
  ).trim();
}

/** Whether email delivery is configured (a Resend key is present). */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// ---------------------------------------------------------------------------
// Lazy Resend client
// ---------------------------------------------------------------------------

let _client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!_client) _client = new Resend(apiKey);
  return _client;
}

// ---------------------------------------------------------------------------
// Unified send
// ---------------------------------------------------------------------------

export interface SendMailArgs {
  /** Named sender identity (resolves to a from-address on the sending domain). */
  from: SenderKey;
  to: string | string[];
  subject: string;
  /** A React email template element. Provide this OR `html`. */
  react?: ReactElement;
  /** Raw HTML body. Provide this OR `react`. */
  html?: string;
  /** Optional Reply-To (e.g. a contact-form sender's own address). */
  replyTo?: string;
}

/**
 * Send one email through Resend. Never throws.
 *
 * Returns `true` only when Resend accepted the message. Returns `false` when:
 *   • no API key is configured (send skipped), or
 *   • Resend replied with an error, or
 *   • the call threw.
 * This boolean is the honest "did it go out?" signal callers rely on to decide
 * whether to show a fallback (e.g. "copy this link and share it yourself").
 */
export async function sendMail(args: SendMailArgs): Promise<boolean> {
  const client = getClient();
  if (!client) {
    console.warn('[email] RESEND_API_KEY is not set — skipping email send.');
    return false;
  }

  // Resend's typed send() requires exactly one of react/html; branch so the
  // union type is satisfied without an `any` cast.
  const common = {
    from: fromAddress(args.from),
    to: Array.isArray(args.to) ? args.to : [args.to],
    subject: args.subject,
    ...(args.replyTo ? { reply_to: args.replyTo } : {}),
  };

  try {
    const { error } = args.react
      ? await client.emails.send({ ...common, react: args.react })
      : await client.emails.send({ ...common, html: args.html ?? '' });

    if (error) {
      console.error('[email] send failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send threw:', err);
    return false;
  }
}
