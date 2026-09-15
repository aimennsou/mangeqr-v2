import { UserRole } from '@prisma/client';
import NextAuth, { type DefaultSession } from 'next-auth';

export type ExtendedUser = DefaultSession['user'] & {
  tempEmail: string | null;
  role: UserRole;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
  /** True once the owner has completed the first-login onboarding wizard. */
  onboarded: boolean;
};

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
  }
}
