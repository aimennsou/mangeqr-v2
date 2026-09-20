'use server';

import * as z from 'zod';
import { AuthError } from 'next-auth';

import {
  generateTwoFactorToken,
  generateVerificationToken
} from '@/lib/tokens';
import { db } from '@/lib/db';
import { SignInSchema } from '@/schemas';
import { getUserByEmail } from '@/data/user';
import { isWorkspaceMember } from '@/data/workspace';
import { signIn as authSignIn } from '@/auth';
import { DEFAULT_SIGNIN_REDIRECT } from '@/routes';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import { sendTwoFactorTokenEmail, sendVerificationEmail } from '@/lib/mail';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';

export async function signIn(
  values: z.infer<typeof SignInSchema>,
  callbackUrl?: string | null
) {
  const validatedFields = SignInSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields.' };
  }

  const { email, password, code } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: 'Email does not exist.' };
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(existingUser.id);

    await sendVerificationEmail(
      existingUser.name,
      existingUser.email,
      verificationToken.token
    );

    return { success: 'Confirmation email sent.' };
  }

  // Check if 2FA enabled
  if (existingUser.email && existingUser.isTwoFactorEnabled) {
    // If verifying 2FA code
    if (code) {
      // Verify the 2FA code
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);

      if (!twoFactorToken) {
        return { error: 'Invalid code.' };
      }

      if (twoFactorToken.token !== code) {
        return { error: 'Invalid code.' };
      }

      const hasExpired = new Date(twoFactorToken.expires) < new Date();

      if (hasExpired) {
        return { error: 'Code has expired.' };
      }

      // Delete 2FA token
      await db.twoFactorToken.delete({
        where: {
          id: twoFactorToken.id
        }
      });

      const existingConfirmation = await getTwoFactorConfirmationByUserId(
        existingUser.id
      );

      if (existingConfirmation) {
        // Delete existing 2FA confirmation
        await db.twoFactorConfirmation.delete({
          where: {
            id: existingConfirmation.id
          }
        });
      }

      await db.twoFactorConfirmation.create({
        data: {
          userId: existingUser.id
        }
      });
    }
    // If not verifying 2FA code
    else {
      // Send 2FA code mail
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);
      await sendTwoFactorTokenEmail(
        existingUser.name,
        twoFactorToken.email,
        twoFactorToken.token
      );

      return { twoFactor: true };
    }
  }

  // Compute a role-aware destination. We authenticate with `redirect: false`
  // so NextAuth only sets the session cookie and does NOT throw NEXT_REDIRECT.
  // The client form (useTransition) then reads `redirectTo` from the returned
  // object and calls router.push — a single, consistent navigation strategy.
  //
  // A brand-new OWNER (role USER, never onboarded, not a workspace member) is
  // routed into the first-login onboarding wizard instead of /performances.
  // Superadmins and team members skip onboarding (members can't create
  // restaurants; superadmins go to their console). An explicit callbackUrl
  // (deep link) always wins.
  let defaultDestination: string;
  if (existingUser.role === 'SUPERADMIN') {
    defaultDestination = '/superadmin';
  } else if (existingUser.role === 'STAFF') {
    // #11: back-office follow-up staff land directly in the leads CRM.
    defaultDestination = '/superadmin/leads';
  } else if (
    existingUser.role === 'USER' &&
    !existingUser.onboardedAt &&
    !(await isWorkspaceMember(existingUser.id))
  ) {
    defaultDestination = '/onboarding';
  } else {
    defaultDestination = DEFAULT_SIGNIN_REDIRECT;
  }
  const redirectTo = callbackUrl || defaultDestination;

  try {
    await authSignIn('credentials', {
      email,
      password,
      redirect: false
    });
  } catch (error) {
    // With redirect:false, success no longer throws NEXT_REDIRECT, so any
    // thrown error here is a genuine auth failure.
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Incorrect email or password.' };
        default:
          return { error: 'Oops! Something went wrong.' };
      }
    }
    throw error;
  }

  // Cookie is set; tell the client where to navigate.
  return { success: 'Connexion réussie.', redirectTo };
}
