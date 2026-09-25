import { redirect } from 'next/navigation';

import { currentUser } from '@/lib/authentication';
import {
  isOrderingEnabledForUser,
  memberCanAccess
} from '@/data/workspace';
import type { MemberPermission } from '@/lib/permissions';
import { DEFAULT_SIGNIN_REDIRECT } from '@/routes';

/**
 * Server-side route guards for the protected dashboard.
 *
 * The sidebar already hides sections the account/member can't use, but that is
 * UX only: `middleware.ts` does not (and on the Edge cannot reliably) check the
 * ordering flag or per-member permissions, so a signed-in user could previously
 * navigate straight to /commandes, /cuisine or /tables and get a working board.
 * These helpers close that hole at the page level, where the full session and
 * the DB are available.
 *
 * Platform roles (SUPERADMIN / STAFF) bypass the module flag so support can
 * still inspect a workspace.
 */

/**
 * Require the ordering module (FEAT-1/FEAT-2) plus a specific member
 * permission. Redirects to the default landing page instead of rendering an
 * empty board. Returns the resolved user id for the caller's convenience.
 */
export async function requireOrderingModule(
  permission: Extract<MemberPermission, 'orders' | 'tables'>
): Promise<string> {
  const user = await currentUser();
  // Not signed in: middleware normally handles this, but never render without a
  // session if the guard is reached directly.
  if (!user?.id) redirect('/auth/sign-in');

  const isPlatformRole = user.role === 'SUPERADMIN' || user.role === 'STAFF';

  if (!isPlatformRole) {
    const orderingEnabled = await isOrderingEnabledForUser(user.id);
    if (!orderingEnabled) redirect(DEFAULT_SIGNIN_REDIRECT);
  }

  // Owners implicitly pass; members need the granted permission.
  const allowed = await memberCanAccess(user.id, permission);
  if (!allowed) redirect(DEFAULT_SIGNIN_REDIRECT);

  return user.id;
}
