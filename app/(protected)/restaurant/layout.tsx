import type { ReactNode } from 'react';

import { requirePermission } from '../_lib/guards';

/**
 * Server-side permission gate for /restaurant, the owner's private restaurant
 * list. The matching API check is in /api/magasin.
 *
 * Note the name collision with the PUBLIC diner menu at app/restaurant/[id] —
 * a different route tree entirely. This layout only applies inside the
 * (protected) group. The same overload is why app/robots.ts has to pair
 * `Disallow: /restaurant` with a more specific `Allow: /restaurant/`.
 */
export default async function RestaurantLayout({ children }: { children: ReactNode }) {
  await requirePermission('restaurants');
  return <>{children}</>;
}
