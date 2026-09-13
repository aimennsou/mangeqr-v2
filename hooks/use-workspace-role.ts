'use client';

import { useEffect, useState } from 'react';
import type { UserRole } from '@prisma/client';

import type { WorkspaceNavRole } from '@/lib/menu-list';

interface TeamContext {
  role?: WorkspaceNavRole;
  appRole?: UserRole | null;
  orderingEnabled?: boolean;
}

/**
 * Client hook that resolves the current user's workspace role via
 * `GET /api/team/context` (mangeqr-team, T9). Used to hide owner-only sidebar
 * entries from MEMBERS. Defaults to "OWNER" until resolved so owners never see
 * a flash of missing navigation; members briefly see the full list before the
 * fetch resolves, which is acceptable UX (server routes remain authoritative).
 */
export function useWorkspaceRole(): WorkspaceNavRole {
  const [role, setRole] = useState<WorkspaceNavRole>('OWNER');

  useEffect(() => {
    let active = true;

    fetch('/api/team/context')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TeamContext | null) => {
        if (active && data?.role === 'MEMBER') {
          setRole('MEMBER');
        }
      })
      .catch(() => {
        // On failure, keep the default OWNER role (no owner-only items hidden).
      });

    return () => {
      active = false;
    };
  }, []);

  return role;
}

/**
 * Client hook that resolves the current user's APP role (UserRole) via the same
 * `/api/team/context` endpoint (superadmin, S6). Used to show the SUPERADMIN-only
 * "Super Admin" sidebar entry. Defaults to null until resolved so the link is
 * NEVER shown to non-superadmins (fail-closed). UX-only: server guards remain
 * authoritative.
 */
export function useAppRole(): UserRole | null {
  const [appRole, setAppRole] = useState<UserRole | null>(null);

  useEffect(() => {
    let active = true;

    fetch('/api/team/context')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TeamContext | null) => {
        if (active && data?.appRole) {
          setAppRole(data.appRole);
        }
      })
      .catch(() => {
        // Fail closed: keep null so the Super Admin link stays hidden.
      });

    return () => {
      active = false;
    };
  }, []);

  return appRole;
}

/**
 * Client hook that resolves whether ORDERING is enabled for the current
 * workspace (FEAT-1/D16), via the same `/api/team/context` endpoint. Used to
 * show/hide the ordering-related sidebar entries (Plan de salle, Commandes,
 * Cuisine). Defaults to false (fail-closed) so the entries stay hidden until
 * confirmed enabled. UX-only: server guards remain authoritative.
 */
export function useOrderingEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;

    fetch('/api/team/context')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TeamContext | null) => {
        if (active && data?.orderingEnabled) {
          setEnabled(true);
        }
      })
      .catch(() => {
        // Fail closed: keep ordering entries hidden.
      });

    return () => {
      active = false;
    };
  }, []);

  return enabled;
}
