import { UserRole } from '@prisma/client';
import NextAuth, { type DefaultSession } from 'next-auth';

export type ExtendedUser = DefaultSession['user'] & {
  tempEmail: string | null;
  role: UserRole;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
  /** True once the owner has completed the first-login onboarding wizard. */
  onboarded: boolean;
  /**
   * Back-office permissions for ADMIN accounts (#2). Raw JSON array of keys
   * from `User.adminPermissions`; consumers normalize via
   * `parseAdminPermissions`. Null/absent for non-ADMIN accounts.
   */
  adminPermissions: unknown;
};

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
  }
}
