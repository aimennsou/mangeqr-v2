import type { ReactNode } from 'react';

import { requirePermission } from '../_lib/guards';

/**
 * Server-side permission gate for /numerique (menu appearance + QR code). The
 * matching checks are in the update-display-config, update-menu-appearance and
 * update-printer-config server actions.
 */
export default async function NumeriqueLayout({ children }: { children: ReactNode }) {
  await requirePermission('numerique');
  return <>{children}</>;
}
