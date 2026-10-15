import { UserRole } from '@prisma/client';

import { currentUser } from '@/lib/authentication';
import {
  parseAdminPermissions,
  hasAdminPermission,
  type AdminPermission,
} from '@/lib/admin-permissions';

/**
 * Back-office access resolution (#2).
 *
 * SUPERADMIN has full access to every back-office section. An ADMIN is a
 * SUPERADMIN helper with a granted permission set (`User.adminPermissions`) and
 * can only reach the sections they were granted. STAFF keeps its legacy
 * leads-only access (handled separately by `requireLeadsAccess`).
 *
 * This is the authoritative server-side gate for `/superadmin/*` pages and the
 * back-office actions; the nav hiding in `lib/menu-list.ts` is UX only.
 */
export async function canAccessBackoffice(
  permission: AdminPermission,
): Promise<boolean> {
  const user = await currentUser();
  if (!user?.id) return false;
  if (user.role === UserRole.SUPERADMIN) return true;
  if (user.role === UserRole.ADMIN) {
    return hasAdminPermission(
      parseAdminPermissions(user.adminPermissions),
      permission,
    );
  }
  return false;
}
