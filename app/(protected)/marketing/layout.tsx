import type { ReactNode } from 'react';

import { requireWorkspaceOwner } from '../_lib/guards';

/**
 * Server-side gate for /marketing.
 *
 * Marketing is the one dashboard area with no MemberPermission key, so there is
 * nothing to grant: lib/menu-list.ts shows a member only the hrefs a granted
 * permission unlocks, which means a member never sees the Marketing entry but
 * could still reach the page by typing the URL. Owner-only until a 'marketing'
 * permission exists.
 */
export default async function MarketingLayout({ children }: { children: ReactNode }) {
  await requireWorkspaceOwner();
  return <>{children}</>;
}
