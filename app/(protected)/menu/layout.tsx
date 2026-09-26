import type { ReactNode } from 'react';

import { requirePermission } from '../_lib/guards';

/**
 * Server-side permission gate for /menu.
 *
 * The guard lives in a layout rather than in page.tsx because these pages are
 * large `'use client'` components; a layout gates them without splitting each
 * one into a server shell plus a client view, and it automatically covers any
 * future sub-route of the segment.
 *
 * The APIs are the real security boundary (/api/menu re-checks the same
 * permission and returns 403). This stops a member without `menus` from
 * landing on a page that renders and then fails every request.
 */
export default async function MenuLayout({ children }: { children: ReactNode }) {
  await requirePermission('menus');
  return <>{children}</>;
}
