import { Resend } from 'resend';

import { PasswordReset } from '@/components/emails/password-reset';
import { EmailVerification } from '@/components/emails/email-verification';
import { TwoFactorAuthentication } from '@/components/emails/two-factor-authentication';

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

export async function sendPasswordResetEmail(
  name: string | null,
  email: string,
  token: string
) {
  const resetLink = `${domain}/auth/reset-password?token=${token}`;

  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: 'MangeQR <reset@mangeqr.com>',
    to: [email],
    subject: 'Réinitialisation de votre mot de passe',
    react: PasswordReset({ name, resetLink })
  });
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
