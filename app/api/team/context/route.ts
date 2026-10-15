import { NextResponse } from 'next/server';

import { currentUser } from '@/lib/authentication';
import { getWorkspaceContext, isOrderingEnabledForUser } from '@/data/workspace';

/**
 * GET /api/team/context (mangeqr-team, T6/T9; extended for superadmin S6).
 *
 * Returns the authenticated user's WORKSPACE role (OWNER/MEMBER) so the sidebar
 * can hide owner-only entries from MEMBERS, and the APP role (UserRole) so the
 * sidebar can show the SUPERADMIN-only "Super Admin" entry. This is UX-only:
 * server-side guards remain authoritative. Never trust these values for access
 * control.
 */
export async function GET() {
  const user = await currentUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ role, permissions }, orderingEnabled] = await Promise.all([
    getWorkspaceContext(user.id),
    isOrderingEnabledForUser(user.id)
  ]);

  return NextResponse.json(
    {
      role,
      permissions,
      appRole: user.role ?? null,
      orderingEnabled,
      // ADMIN back-office permissions (#2). Raw JSON from the session; the nav
      // normalizes it via parseAdminPermissions.
      adminPermissions: user.adminPermissions ?? null,
    },
    { status: 200 }
  );
}
