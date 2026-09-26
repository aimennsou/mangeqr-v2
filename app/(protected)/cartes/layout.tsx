import type { ReactNode } from 'react';

import { requireWorkspaceOwner } from '../_lib/guards';

/**
 * Server-side gate for /cartes ("Menu physique" — the printable card designer
 * and design-order flow).
 *
 * Like /marketing, this area has no MemberPermission key, so lib/menu-list.ts
 * never shows it to a member, but the URL was still reachable. Owner-only,
 * which matches the intended navigation exactly.
 */
export default async function CartesLayout({ children }: { children: ReactNode }) {
  await requireWorkspaceOwner();
  return <>{children}</>;
}
