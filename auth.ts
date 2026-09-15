import NextAuth from 'next-auth';
import { UserRole } from '@prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { db } from '@/lib/db';
import authConfig from '@/auth.config';
import { getUserById } from '@/data/user';
import { getAccountByUserId } from '@/data/account';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  update
} = NextAuth({
  pages: {
    signIn: '/auth/sign-in',
    error: '/auth/error'
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: {
          id: user.id
        },
        data: {
          emailVerified: new Date()
        }
      });
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log('[SIGNIN-DEBUG] callback start; user.id=', user?.id, 'provider=', account?.provider);
      // Load the user for ALL providers so the suspension gate below applies to
      // OAuth and credentials alike (superadmin, S3).
      const existingUser = await getUserById(user.id);

      console.log('[SIGNIN-DEBUG] existingUser found=', !!existingUser, 'verified=', !!existingUser?.emailVerified, 'suspended=', existingUser?.suspended, 'role=', existingUser?.role);
      // Block suspended users from signing in by ANY provider.
      if (existingUser?.suspended) {
        console.log('[SIGNIN-DEBUG] REJECT: suspended');
        return false;
      }

      // Skip email verification / 2FA checks for OAuth (still gated on suspend).
      if (account?.provider !== 'credentials') {
        return true;
      }

      // Prevent unverified email sign in
      if (!existingUser?.emailVerified) {
        console.log('[SIGNIN-DEBUG] REJECT: not verified (existingUser null? '+(!existingUser)+')');
        return false;
      }

      // Check if 2FA enabled
      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id
        );

        // Prevent unconfirmed 2FA sign in
        if (!twoFactorConfirmation) {
          return false;
        }

        // Delete 2FA confirmation for next sign in
        await db.twoFactorConfirmation.delete({
          where: {
            id: twoFactorConfirmation.id
          }
        });
      }

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.tempEmail = token.tempEmail as string | null;
        session.user.isOAuth = token.isOAuth as boolean;
        session.user.onboarded = token.onboarded as boolean;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) {
        return token;
      }

      const existingUser = await getUserById(token.sub);

      if (!existingUser) {
        return token;
      }

      // If the user was suspended after signing in, invalidate their session on
      // the next jwt refresh (best-effort): drop the subject so downstream
      // session checks treat them as signed-out (superadmin, S3).
      if (existingUser.suspended) {
        token.sub = undefined;
        return token;
      }

      const existingAccount = await getAccountByUserId(existingUser.id);

      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.tempEmail = existingUser.tempEmail;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
      // Onboarding: expose whether the owner has completed the first-login
      // wizard so the app can gate the /onboarding redirect.
      token.onboarded = !!existingUser.onboardedAt;

      return token;
    }
  },
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  ...authConfig
});
