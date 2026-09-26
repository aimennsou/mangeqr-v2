import type { ReactNode } from 'react';

import { requirePermission } from '../_lib/guards';

/**
 * Server-side permission gate for /performances. The matching API check is on
 * /api/order-metrics.
 *
 * Careful here: /performances is DEFAULT_SIGNIN_REDIRECT (routes.ts), so this is
 * the one guard that could loop. requirePermission deliberately bounces to
 * memberLandingHref(permissions) — the member's own first allowed area, or
 * /settings — rather than to that constant. Do not "simplify" the guard back to
 * redirecting to DEFAULT_SIGNIN_REDIRECT.
 */
export default async function PerformancesLayout({ children }: { children: ReactNode }) {
  await requirePermission('performances');
  return <>{children}</>;
}
