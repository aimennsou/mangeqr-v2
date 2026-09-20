/**
 * Granular per-member workspace permissions.
 *
 * A workspace MEMBER always acts on the OWNER's data, but the owner can now
 * restrict WHICH areas a given member can access. Permissions are stored as a
 * JSON array of keys on `Membership.permissions` (and pre-chosen on
 * `Invitation.permissions`, copied over on redeem).
 *
 * These are UX + server-side gates layered on top of the coarse OWNER/MEMBER
 * role. Owners implicitly have every permission; the checks below only matter
 * for members. Nav hiding is UX only — server actions/routes must re-check.
 */

export type MemberPermission =
  | 'performances' // Mes performances (analytics)
  | 'menus' // Menus + Catégories & plats (create/edit dishes)
  | 'reviews' // Avis clients
  | 'orders'; // Commandes + Cuisine (order taking / kitchen)

/** All assignable permissions, in display order, with French labels. */
export const MEMBER_PERMISSIONS: {
  key: MemberPermission;
  label: string;
  description: string;
}[] = [
  {
    key: 'performances',
    label: 'Performances',
    description: 'Consulter les statistiques et le suivi.',
  },
  {
    key: 'menus',
    label: 'Menus & plats',
    description: 'Gérer les menus, catégories et plats.',
  },
  {
    key: 'reviews',
    label: 'Avis clients',
    description: 'Consulter les avis des clients.',
  },
  {
    key: 'orders',
    label: 'Commandes & cuisine',
    description: 'Prendre les commandes et gérer la vue cuisine.',
  },
];

export const ALL_PERMISSION_KEYS: MemberPermission[] = MEMBER_PERMISSIONS.map(
  (p) => p.key,
);

/**
 * Default permissions for a new member when the owner doesn't customize them.
 * Mirrors the previous member experience (everything a member could see).
 */
export const DEFAULT_MEMBER_PERMISSIONS: MemberPermission[] = [
  'performances',
  'menus',
  'reviews',
  'orders',
];

/** Nav hrefs each permission unlocks (used to filter the member sidebar). */
export const PERMISSION_HREFS: Record<MemberPermission, string[]> = {
  performances: ['/performances'],
  menus: ['/menu', '/categories'],
  reviews: ['/reviews'],
  orders: ['/commandes', '/cuisine'],
};

/**
 * Normalize an unknown JSON value (from the DB) into a valid permission list.
 * `null`/invalid => the default set (backwards compatible with members created
 * before permissions existed).
 */
export function parsePermissions(value: unknown): MemberPermission[] {
  if (!Array.isArray(value)) return [...DEFAULT_MEMBER_PERMISSIONS];
  const set = value.filter((v): v is MemberPermission =>
    ALL_PERMISSION_KEYS.includes(v as MemberPermission),
  );
  return set.length > 0 ? set : [...DEFAULT_MEMBER_PERMISSIONS];
}

/** True when the given permission list grants `perm`. */
export function hasPermission(
  permissions: MemberPermission[] | null | undefined,
  perm: MemberPermission,
): boolean {
  const list = permissions ?? DEFAULT_MEMBER_PERMISSIONS;
  return list.includes(perm);
}
