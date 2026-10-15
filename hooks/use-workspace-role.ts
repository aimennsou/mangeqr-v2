'use client';

import { useEffect, useState } from 'react';
import type { UserRole } from '@prisma/client';

import type { WorkspaceNavRole } from '@/lib/menu-list';
import type { MemberPermission } from '@/lib/permissions';
import {
  parseAdminPermissions,
  type AdminPermission,
} from '@/lib/admin-permissions';

interface TeamContext {
  role?: WorkspaceNavRole;
  permissions?: MemberPermission[] | null;
  appRole?: UserRole | null;
  orderingEnabled?: boolean;
  /** Raw JSON from the session; normalized by consumers. */
  adminPermissions?: unknown;
}

/**
 * Single source of truth for the current user's workspace context
 * (role / appRole / orderingEnabled), resolved via `GET /api/team/context`.
 *
 * Why this exists (bug fix): the sidebar previously used THREE independent
 * hooks that each fetched this endpoint with NO retry. Right after a
 * dev-server reload / hard refresh the auth session isn't hydrated yet, so the
 * request can transiently return 401 → the hooks kept their fail-closed
 * defaults forever (ordering group, Super Admin entry stayed hidden until a
 * full re-login). This hook:
 *   - fetches ONCE and shares the result across all three consumer hooks,
 *   - RETRIES with backoff on failure/401 (session hydrating), and
 *   - re-fetches when the tab regains focus,
 * so the nav self-heals instead of getting stuck.
 */
// Module-level cache so the THREE consumer hooks (role/appRole/ordering) share
// a single resolved result + a single in-flight request, and subscribers are
// notified when it resolves. Cleared so a focus re-check can refresh it.
let cachedCtx: TeamContext | null = null;
let inFlight: Promise<TeamContext | null> | null = null;
const subscribers = new Set<(c: TeamContext | null) => void>();

function notify(c: TeamContext | null) {
  cachedCtx = c;
  subscribers.forEach((fn) => fn(c));
}

/**
 * Fetch /api/team/context with retry/backoff (handles the post-reload window
 * where the auth session isn't hydrated yet and the route transiently 401s).
 * Resolves the shared cache and notifies subscribers on success.
 */
async function loadTeamContext(): Promise<void> {
  if (inFlight) return void inFlight;
  const run = async (): Promise<TeamContext | null> => {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const res = await fetch('/api/team/context', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as TeamContext;
          notify(data);
          return data;
        }
      } catch {
        /* retry below */
      }
      // Backoff: 300ms, 600ms, 1200ms, 2400ms, 4800ms.
      await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
    }
    return cachedCtx;
  };
  inFlight = run().finally(() => {
    inFlight = null;
  });
  await inFlight;
}

function useTeamContext(): TeamContext | null {
  const [ctx, setCtx] = useState<TeamContext | null>(cachedCtx);

  useEffect(() => {
    // Subscribe to shared updates.
    const sub = (c: TeamContext | null) => setCtx(c);
    subscribers.add(sub);

    // Kick off (or reuse) the shared fetch; seed from cache if present.
    if (cachedCtx) setCtx(cachedCtx);
    void loadTeamContext();

    // Re-check when the tab regains focus (covers stale/expired first loads).
    const onFocus = () => void loadTeamContext();
    window.addEventListener('focus', onFocus);

    return () => {
      subscribers.delete(sub);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return ctx;
}

/**
 * Workspace role (OWNER/MEMBER) for hiding owner-only sidebar entries from
 * MEMBERS. Defaults to "OWNER" until resolved so owners never see a flash of
 * missing navigation. UX-only: server routes remain authoritative.
 */
export function useWorkspaceRole(): WorkspaceNavRole {
  const ctx = useTeamContext();
  return ctx?.role === 'MEMBER' ? 'MEMBER' : 'OWNER';
}

/**
 * Current member's granular permissions, or `null` for owners (who implicitly
 * have all permissions). `undefined` while still resolving.
 */
export function useMemberPermissions(): MemberPermission[] | null | undefined {
  const ctx = useTeamContext();
  if (!ctx) return undefined;
  return ctx.permissions ?? null;
}

/**
 * APP role (UserRole) — shows the SUPERADMIN-only "Super Admin" sidebar entry.
 * Null until resolved (fail-closed) so the link never shows to non-superadmins.
 */
export function useAppRole(): UserRole | null {
  const ctx = useTeamContext();
  return ctx?.appRole ?? null;
}

/**
 * ADMIN back-office permissions (#2). Empty array until resolved (fail-closed)
 * so back-office entries never flash for an ADMIN without the permission.
 */
export function useAdminPermissions(): AdminPermission[] {
  const ctx = useTeamContext();
  return parseAdminPermissions(ctx?.adminPermissions);
}

/**
 * Whether ORDERING is enabled for the current workspace (FEAT-1/D16) — gates
 * the Commandes / Cuisine / Plan de salle sidebar entries. Fail-closed until
 * resolved. Thanks to the shared retrying context above, this no longer gets
 * stuck hidden after a dev reload.
 */
export function useOrderingEnabled(): boolean {
  const ctx = useTeamContext();
  return ctx?.orderingEnabled ?? false;
}
