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

import type { TranslationKey } from '@/lib/i18n/dictionaries';

export type MemberPermission =
  | 'performances' // Mes performances (analytics)
  | 'menus' // Menus + Catégories & plats (create/edit dishes)
  | 'reviews' // Avis clients
  | 'orders' // Commandes + Cuisine (order taking / kitchen)
  | 'tables' // Plan de salle (manage tables)
  | 'numerique' // Menu numérique : apparence & QR code
  | 'restaurants'; // Mes restaurants (manage restaurants)

/**
 * All assignable permissions, in display order.
 *
 * Carries dictionary KEYS, not text. It used to hold literal French `label` /
 * `description` strings, and because this is a module-scope constant it was
 * evaluated once before any I18nProvider existed — so the permission grid on the
 * team screen could never follow a language switch. (Same trap as the old
 * `ORDER_STATUS_LABEL` and the charts' `chartConfig`.) Callers resolve the keys
 * with `t()` at render time.
 *
 * Typed as `TranslationKey` so a typo or a missing dictionary entry fails
 * compilation rather than rendering a raw key on screen.
 */
export const MEMBER_PERMISSIONS: {
  key: MemberPermission;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
}[] = [
  {
    key: 'performances',
    labelKey: 'perm.performances.label',
    descriptionKey: 'perm.performances.desc',
  },
  {
    key: 'menus',
    labelKey: 'perm.menus.label',
    descriptionKey: 'perm.menus.desc',
  },
  {
    key: 'reviews',
    labelKey: 'perm.reviews.label',
    descriptionKey: 'perm.reviews.desc',
  },
  {
    key: 'orders',
    labelKey: 'perm.orders.label',
    descriptionKey: 'perm.orders.desc',
  },
  {
    key: 'tables',
    labelKey: 'perm.tables.label',
    descriptionKey: 'perm.tables.desc',
  },
  {
    key: 'numerique',
    labelKey: 'perm.numerique.label',
    descriptionKey: 'perm.numerique.desc',
  },
  {
    key: 'restaurants',
    labelKey: 'perm.restaurants.label',
    descriptionKey: 'perm.restaurants.desc',
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
  tables: ['/tables'],
  numerique: ['/numerique'],
  restaurants: ['/restaurant'],
};

/**
 * Resolve the landing route for a MEMBER from their granted permissions: the
 * first area they can reach (in MEMBER_PERMISSIONS display order), else
 * `/settings`, which lib/menu-list.ts keeps available to every member
 * regardless of permissions.
 *
 * Route guards must redirect here rather than to DEFAULT_SIGNIN_REDIRECT.
 * That constant is `/performances`, so a guard on /performances that redirected
 * to it would loop forever for a member without the `performances` permission.
 *
 * Mirrors adminLandingHref in lib/admin-permissions.ts.
 */
export function memberLandingHref(
  permissions: MemberPermission[] | null | undefined,
): string {
  const perms = permissions ?? DEFAULT_MEMBER_PERMISSIONS;
  for (const { key } of MEMBER_PERMISSIONS) {
    if (perms.includes(key)) {
      return PERMISSION_HREFS[key][0];
    }
  }
  return '/settings';
}

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
