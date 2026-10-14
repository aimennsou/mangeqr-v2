import { PasswordReset } from '@/components/emails/password-reset';
import { EmailVerification } from '@/components/emails/email-verification';
import { TwoFactorAuthentication } from '@/components/emails/two-factor-authentication';
import { TeamInvitation } from '@/components/emails/team-invitation';
import { sendMail } from '@/lib/email';

const domain = process.env.AUTH_URL;

/**
 * Transactional auth emails. All delivery goes through the shared `sendMail`
 * core (lib/email.ts): one Resend client, configurable sending domain, and a
 * uniform "did it actually send?" boolean (Resend reports failures in the
 * response body, not by throwing). None of these throw — sends are best-effort
 * and degrade gracefully when RESEND_API_KEY is unset.
 */

export async function sendVerificationEmail(
  name: string | null,
  email: string,
  token: string
): Promise<boolean> {
  const verifyLink = `${domain}/auth/email-verification?token=${token}`;
  return sendMail({
    from: 'confirmation',
    to: email,
    subject: 'Vérification de votre adresse e-mail',
    react: EmailVerification({ name, verifyLink }),
  });
}

/**
 * Email a password-reset link. Returns whether the mail was ACTUALLY dispatched
 * so the owner-triggered member reset can say "copy this link yourself" instead
 * of claiming an email went out.
 */
export async function sendPasswordResetEmail(
  name: string | null,
  email: string,
  token: string
): Promise<boolean> {
  const resetLink = `${domain}/auth/reset-password?token=${token}`;
  return sendMail({
    from: 'reset',
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    react: PasswordReset({ name, resetLink }),
  });
}

export async function sendTwoFactorTokenEmail(
  name: string | null,
  email: string,
  token: string
): Promise<boolean> {
  return sendMail({
    from: 'twoFactor',
    to: email,
    subject: 'Votre code d\'authentification à deux facteurs',
    react: TwoFactorAuthentication({ name, token }),
  });
}

/**
 * Email a workspace invitation to the invitee. Returns whether the email was
 * actually dispatched, so the caller can tell the owner "invitation sent" vs
 * "copy this link and share it yourself".
 */
export async function sendTeamInvitationEmail(args: {
  email: string;
  name: string | null;
  ownerName: string | null;
  code: string;
  inviteLink: string;
}): Promise<boolean> {
  return sendMail({
    from: 'team',
    to: args.email,
    subject: 'Vous êtes invité à rejoindre une équipe sur MangeQR',
    react: TeamInvitation({
      name: args.name,
      ownerName: args.ownerName,
      code: args.code,
      inviteLink: args.inviteLink,
    }),
  });
}
