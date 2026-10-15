/**
 * Back-office (ADMIN) permissions (#2).
 *
 * An ADMIN is a SUPERADMIN helper: they get the back-office console (NOT the
 * restaurateur app), but only the sections the SUPERADMIN grants them. This is
 * the ADMIN equivalent of `lib/permissions.ts` (which is for workspace MEMBERS)
 * — a separate concept layered on the `ADMIN` UserRole.
 *
 * Permissions are stored as a JSON array of keys on `User.adminPermissions`.
 * SUPERADMIN implicitly has every permission; these checks only matter for
 * ADMIN accounts. Nav hiding is UX only — server actions/routes must re-check.
 */

export type AdminPermission =
  | 'users' // Utilisateurs (manage accounts / plans)
  | 'restaurants' // Restaurants (manage restaurants)
  | 'design-orders' // Commandes de designs
  | 'leads' // Leads CRM
  | 'upgrades' // Demandes de forfait
  | 'devis' // Demandes de devis
  | 'support'; // Messages / support

/** All assignable back-office permissions, in display order, French labels. */
export const ADMIN_PERMISSIONS: {
  key: AdminPermission;
  label: string;
  description: string;
}[] = [
  {
    key: 'users',
    label: 'Utilisateurs',
    description: 'Gérer les comptes, forfaits et suspensions.',
  },
  {
    key: 'restaurants',
    label: 'Restaurants',
    description: 'Gérer les restaurants des comptes.',
  },
  {
    key: 'design-orders',
    label: 'Commandes de designs',
    description: 'Suivre et traiter les commandes de designs.',
  },
  {
    key: 'leads',
    label: 'Leads',
    description: 'Suivre et relancer les prospects (CRM).',
  },
  {
    key: 'upgrades',
    label: 'Demandes de forfait',
    description: 'Traiter les demandes de mise à niveau (espèces).',
  },
  {
    key: 'devis',
    label: 'Demandes de devis',
    description: 'Traiter les demandes de matériel (bornes & TV).',
  },
  {
    key: 'support',
    label: 'Messages',
    description: 'Répondre aux messages de support.',
  },
];

export const ALL_ADMIN_PERMISSION_KEYS: AdminPermission[] = ADMIN_PERMISSIONS.map(
  (p) => p.key,
);

/** Nav hrefs each back-office permission unlocks (used to filter the sidebar). */
export const ADMIN_PERMISSION_HREFS: Record<AdminPermission, string[]> = {
  users: ['/superadmin/users'],
  restaurants: ['/superadmin/restaurants'],
  'design-orders': ['/superadmin/design-orders'],
  leads: ['/superadmin/leads'],
  upgrades: ['/superadmin/upgrades'],
  devis: ['/superadmin/devis'],
  support: ['/superadmin/support'],
};

/**
 * Normalize an unknown JSON value (from the DB) into a valid permission list.
 * `null`/invalid => an EMPTY list (an ADMIN with no granted permissions has no
 * back-office access — fail-closed, unlike members which default to full).
 */
export function parseAdminPermissions(value: unknown): AdminPermission[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is AdminPermission =>
    ALL_ADMIN_PERMISSION_KEYS.includes(v as AdminPermission),
  );
}

/** True when the given permission list grants `perm`. */
export function hasAdminPermission(
  permissions: AdminPermission[] | null | undefined,
  perm: AdminPermission,
): boolean {
  return (permissions ?? []).includes(perm);
}

/**
 * Resolve the landing route for an ADMIN based on their granted permissions:
 * the first section they can access (in display order), or `/superadmin` as a
 * fallback (that page itself will show a "no access" state / redirect).
 */
export function adminLandingHref(
  permissions: AdminPermission[] | null | undefined,
): string {
  const perms = permissions ?? [];
  for (const { key } of ADMIN_PERMISSIONS) {
    if (perms.includes(key)) {
      return ADMIN_PERMISSION_HREFS[key][0];
    }
  }
  return '/superadmin';
}
