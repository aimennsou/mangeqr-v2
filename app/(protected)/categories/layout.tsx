import type { ReactNode } from 'react';

import { requirePermission } from '../_lib/guards';

/**
 * Server-side permission gate for /categories. Shares the `menus` permission
 * with /menu (see PERMISSION_HREFS in lib/permissions.ts). The matching API
 * checks are in /api/categorie and /api/plat.
 */
export default async function CategoriesLayout({ children }: { children: ReactNode }) {
  await requirePermission('menus');
  return <>{children}</>;
}
