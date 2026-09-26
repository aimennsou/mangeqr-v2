import { Resend } from 'resend';

import { PasswordReset } from '@/components/emails/password-reset';
import { EmailVerification } from '@/components/emails/email-verification';
import { TwoFactorAuthentication } from '@/components/emails/two-factor-authentication';
import { TeamInvitation } from '@/components/emails/team-invitation';

const domain = process.env.AUTH_URL;

// Instantiate Resend lazily. Constructing it at module scope throws
// ("Missing API key") when RESEND_API_KEY is unset, which would crash any
// server action that merely imports this module (e.g. sign-in) — even when no
// email actually needs to be sent (local dev / mock data). Creating it on demand
// keeps imports safe and lets us degrade gracefully when the key is missing.
function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[mail] RESEND_API_KEY is not set — skipping email send.');
    return null;
  }
  return new Resend(apiKey);
}

export async function sendVerificationEmail(
  name: string | null,
  email: string,
  token: string
) {
  const verifyLink = `${domain}/auth/email-verification?token=${token}`;

  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: 'MangeQR <confirmation@mangeqr.com>',
    to: [email],
    subject: 'Vérification de votre adresse e-mail',
    react: EmailVerification({ name, verifyLink })
  });
}

/**
 * Email a password-reset link.
 *
 * Returns whether the mail was ACTUALLY dispatched (same contract as
 * `sendTeamInvitationEmail`). It used to return void, which made every caller
 * unable to distinguish "sent" from "silently skipped because RESEND_API_KEY is
 * unset" or "Resend replied with an error" — Resend reports failures in the
 * response body rather than throwing, so awaiting without inspecting `error`
 * looks like success. The owner-triggered member reset needs the truth so it can
 * say "copy this link yourself" instead of claiming an email went out.
 *
 * Never throws: existing callers treat this as best-effort.
 */
export async function sendPasswordResetEmail(
  name: string | null,
  email: string,
  token: string
): Promise<boolean> {
  const resetLink = `${domain}/auth/reset-password?token=${token}`;

  const resend = getResend();
  if (!resend) return false;

  try {
    const { error } = await resend.emails.send({
      from: 'MangeQR <reset@mangeqr.com>',
      to: [email],
      subject: 'Réinitialisation de votre mot de passe',
      react: PasswordReset({ name, resetLink })
    });
    if (error) {
      console.error('[mail] password reset send failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[mail] password reset send threw:', err);
    return false;
  }
}

export async function sendTwoFactorTokenEmail(
  name: string | null,
  email: string,
  token: string
) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: 'MangeQR <2fa@mangeqr.com>',
    to: [email],
    subject: 'Votre code d\'authentification à deux facteurs',
    react: TwoFactorAuthentication({ name, token })
  });
}

/**
 * Email a workspace invitation to the invitee.
 *
 * Returns whether the email was actually dispatched, so the caller can tell the
 * owner "invitation sent" vs "copy this link and share it yourself" instead of
 * silently implying an email went out. Never throws: a mail failure must not
 * fail invite creation, since the code/link is still valid and shareable.
 */
export async function sendTeamInvitationEmail(args: {
  email: string;
  name: string | null;
  ownerName: string | null;
  code: string;
  inviteLink: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    const { error } = await resend.emails.send({
      from: 'MangeQR <equipe@mangeqr.com>',
      to: [args.email],
      subject: 'Vous êtes invité à rejoindre une équipe sur MangeQR',
      react: TeamInvitation({
        name: args.name,
        ownerName: args.ownerName,
        code: args.code,
        inviteLink: args.inviteLink
      })
    });
    if (error) {
      console.error('[mail] team invitation send failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[mail] team invitation send threw:', err);
    return false;
  }
}
