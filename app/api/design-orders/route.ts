import { NextResponse } from 'next/server';

import { currentUserId } from '@/lib/authentication';
import { getWorkspaceOwnerId } from '@/data/workspace';
import { listDesignOrders } from '@/data/design-order';

/**
 * GET /api/design-orders — the current workspace owner's design orders (QR &
 * physical-menu), newest first. Owner-scoped: the caller is resolved to their
 * workspace OWNER so members see the owner's orders (read-only tracking).
 * Requires auth; returns 401 otherwise.
 */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ownerId = await getWorkspaceOwnerId(userId);
  const orders = await listDesignOrders(ownerId);

  return NextResponse.json({ orders }, { status: 200 });
}
