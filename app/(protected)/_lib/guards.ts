import { redirect } from 'next/navigation';

import { currentUser } from '@/lib/authentication';
import {
  getWorkspaceContext,
  isOrderingEnabledForUser
} from '@/data/workspace';
import {
  hasPermission,
  memberLandingHref,
  type MemberPermission
} from '@/lib/permissions';

/**
 * Server-side route guards for the protected dashboard.
 *
 * The sidebar already hides sections the account/member can't use, but that is
 * UX only: `middleware.ts` does not (and on the Edge cannot reliably) check the
 * ordering flag or per-member permissions, so a signed-in user could previously
 * navigate straight to a dashboard URL and get a working page whose every
 * request then 403'd.
 *
 * The APIs and server actions remain the real security boundary. These guards
 * exist so a member lands somewhere useful instead of on a broken page.
 *
 * Platform roles (SUPERADMIN / STAFF) bypass everything so support can still
 * inspect a workspace.
 */

interface Viewer {
  id: string;
  isPlatformRole: boolean;
  isOwner: boolean;
  permissions: MemberPermission[] | null;
  /** Where to send this viewer when a guard denies them. Never loops. */
  fallbackHref: string;
}

/**
 * Resolve the viewer once: session, workspace role, permissions, and the href to
 * bounce them to on denial.
 *
 * The fallback is computed from the member's own permissions rather than using
 * DEFAULT_SIGNIN_REDIRECT, because that constant is `/performances` — guarding
 * /performances and redirecting to the constant would be an infinite loop.
 */
async function resolveViewer(): Promise<Viewer> {
  const user = await currentUser();
  // Not signed in: middleware normally handles this, but never render without a
  // session if a guard is reached directly.
  if (!user?.id) redirect('/auth/sign-in');

  const isPlatformRole = user.role === 'SUPERADMIN' || user.role === 'STAFF';
  const ctx = await getWorkspaceContext(user.id);
  const isOwner = ctx.role === 'OWNER';

  return {
    id: user.id,
    isPlatformRole,
    isOwner,
    permissions: ctx.permissions,
    // Owners are never denied by a permission check, so their fallback only
    // matters for the ordering module flag.
    fallbackHref: isOwner ? '/performances' : memberLandingHref(ctx.permissions)
  };
}

/**
 * Require the ordering module (FEAT-1/FEAT-2) plus a specific member
 * permission. Redirects instead of rendering an empty board. Returns the
 * resolved user id for the caller's convenience.
 */
export async function requireOrderingModule(
  permission: Extract<MemberPermission, 'orders' | 'tables'>
): Promise<string> {
  const viewer = await resolveViewer();
  if (viewer.isPlatformRole) return viewer.id;

  const orderingEnabled = await isOrderingEnabledForUser(viewer.id);
  if (!orderingEnabled) redirect(viewer.fallbackHref);

  // Owners implicitly pass; members need the granted permission.
  if (!viewer.isOwner && !hasPermission(viewer.permissions, permission)) {
    redirect(viewer.fallbackHref);
  }

  return viewer.id;
}

/**
 * Require a single member permission, with no module flag attached.
 *
 * Use this for the areas that are always part of the product (menus, reviews,
 * restaurants, numérique, performances) as opposed to the ordering module,
 * which is feature-flagged per workspace and therefore needs
 * `requireOrderingModule`.
 */
export async function requirePermission(
  permission: MemberPermission
): Promise<string> {
  const viewer = await resolveViewer();
  if (viewer.isPlatformRole || viewer.isOwner) return viewer.id;

  if (!hasPermission(viewer.permissions, permission)) {
    redirect(viewer.fallbackHref);
  }

  return viewer.id;
}

/**
 * Require that the viewer owns their workspace, i.e. is not a member of someone
 * else's.
 *
 * This exists for /marketing. Every other dashboard area maps to a
 * MemberPermission key, but marketing has none: it is absent from
 * PERMISSION_HREFS in lib/permissions.ts, and lib/menu-list.ts shows a member
 * only the hrefs a granted permission unlocks, so a member never sees the
 * Marketing entry. The page was nevertheless reachable by typing the URL.
 *
 * If marketing should later be delegable, add a 'marketing' MemberPermission
 * plus its PERMISSION_HREFS entry and switch that layout to requirePermission.
 */
export async function requireWorkspaceOwner(): Promise<string> {
  const viewer = await resolveViewer();
  if (viewer.isPlatformRole || viewer.isOwner) return viewer.id;

  redirect(viewer.fallbackHref);
}
