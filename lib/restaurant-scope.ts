/**
 * Per-RESTAURANT scoping for workspace members.
 *
 * Area permissions (`lib/permissions.ts`) answer "WHICH SCREENS may this member
 * open". This module answers "WHICH RESTAURANTS may they see on those screens".
 * A waiter hired for one branch should not be looking at another branch's
 * kitchen board just because he was granted the `orders` permission.
 *
 * SEMANTICS — deliberately chosen, do not flip casually:
 *
 *   null  => UNSCOPED: every restaurant belonging to the workspace owner.
 *   [...] => RESTRICTED: only those restaurant ids.
 *
 * An EMPTY array always normalizes to `null`, never to "no restaurants". Two
 * reasons:
 *   1. Backwards compatibility — every Membership that existed before this
 *      column was added has NULL, and those members must keep working.
 *   2. Safety against a UI slip: if "nothing selected" meant "no access", an
 *      owner who saved the permission form without touching the restaurant
 *      picker would silently lock their staff out of the entire workspace, with
 *      an error that looks like data loss rather than a permission setting.
 *
 * OWNERS are never scoped. The scope only ever narrows a MEMBER, and it can only
 * narrow — it can never widen access beyond the owner's own restaurants, because
 * every query still filters on `userId: ownerId` as well.
 */

/**
 * Normalize an unknown JSON value (straight from the DB or a form) into a valid
 * scope.
 *
 * Non-arrays, arrays of non-strings, and empty arrays all collapse to `null`
 * (= unscoped). Entries are trimmed and de-duplicated. Nothing here validates
 * that the ids EXIST or belong to the owner — that is the caller's job, and in
 * practice it happens for free because every query also filters by `ownerId`.
 */
export function parseRestaurantScope(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const ids = Array.from(
    new Set(
      value
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    )
  );

  return ids.length > 0 ? ids : null;
}

/**
 * Whether a scope permits a specific restaurant.
 *
 * `null` (unscoped) permits everything. Note this is only half of an
 * authorization check: the caller must ALSO confirm the restaurant belongs to
 * the workspace owner. See `assertRestaurantInScope` in `data/workspace.ts`,
 * which does both.
 */
export function isRestaurantInScope(
  scope: string[] | null,
  restaurantId: string
): boolean {
  if (scope === null) return true;
  return scope.includes(restaurantId);
}

/**
 * Prisma `where` fragment for the restaurant id, given a scope.
 *
 * Spread into a query alongside the owner filter:
 *
 *   where: { userId: ownerId, ...restaurantIdFilter(scope) }
 *
 * Returns `{}` when unscoped so the caller's query is unchanged — that is what
 * keeps owners and legacy members on the original code path.
 */
export function restaurantIdFilter(
  scope: string[] | null
): { id?: { in: string[] } } {
  if (scope === null) return {};
  return { id: { in: scope } };
}

/**
 * Same as `restaurantIdFilter` but for models that reference a restaurant by
 * foreign key (Order, Menu, Table, …) rather than being the Restaurant itself:
 *
 *   where: { restaurant: { userId: ownerId }, ...restaurantFkFilter(scope) }
 */
export function restaurantFkFilter(
  scope: string[] | null
): { restaurantId?: { in: string[] } } {
  if (scope === null) return {};
  return { restaurantId: { in: scope } };
}

/**
 * The full `restaurant: { … }` relation filter — owner AND scope in one object.
 *
 * This is the workhorse for records that reach a Restaurant through a RELATION
 * rather than holding its id. Most of the app authorizes that way:
 *
 *   Menu          -> restaurant: { userId }
 *   MenuCategory  -> menu: { restaurant: { userId } }
 *   Dish          -> category: { menu: { restaurant: { userId } } }
 *
 * Adding the scope is then a one-line change at each site — swap
 * `{ userId: ownerId }` for `scopedRestaurantWhere(ownerId, scope)` — which
 * keeps the owner check and the scope check impossible to apply separately, and
 * therefore impossible to half-apply:
 *
 *   where: { id, menu: { restaurant: scopedRestaurantWhere(ownerId, scope) } }
 *
 * Unscoped callers get exactly `{ userId: ownerId }`, i.e. the original query.
 */
export function scopedRestaurantWhere(
  ownerId: string,
  scope: string[] | null
): { userId: string; id?: { in: string[] } } {
  return { userId: ownerId, ...restaurantIdFilter(scope) };
}
