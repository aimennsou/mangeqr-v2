import type { ReactNode } from 'react';

import { requirePermission } from '../_lib/guards';

/**
 * Server-side permission gate for /reviews. The matching API check is on
 * GET /api/review; the POST stays public because that is how diners submit a
 * review from the QR menu.
 */
export default async function ReviewsLayout({ children }: { children: ReactNode }) {
  await requirePermission('reviews');
  return <>{children}</>;
}
