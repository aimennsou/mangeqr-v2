import { UserRole, DesignOrderStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { currentRole } from '@/lib/authentication';
import { listDesignOrders, countDesignOrders } from '@/data/superadmin';

/**
 * GET /api/superadmin/design-orders (FEAT-6).
 *
 * SUPERADMIN-gated endpoint wrapping `listDesignOrders`/`countDesignOrders` so
 * the fulfillment table can search, filter by status, and paginate.
 * Non-superadmins get 403 — the role is re-checked server-side (never trust the
 * client).
 *
 * Query params: `search` (string), `status` (DesignOrderStatus), `skip`, `take`.
 */
export async function GET(req: NextRequest) {
  const role = await currentRole();

  if (role !== UserRole.SUPERADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') ?? undefined;

  // Only accept a valid enum value; anything else means "no status filter".
  const rawStatus = searchParams.get('status');
  const status =
    rawStatus && rawStatus in DesignOrderStatus
      ? (rawStatus as DesignOrderStatus)
      : undefined;

  const parsedSkip = Number.parseInt(searchParams.get('skip') ?? '0', 10);
  const parsedTake = Number.parseInt(searchParams.get('take') ?? '20', 10);

  const skip = Number.isNaN(parsedSkip) || parsedSkip < 0 ? 0 : parsedSkip;
  const take =
    Number.isNaN(parsedTake) || parsedTake <= 0 || parsedTake > 100
      ? 20
      : parsedTake;

  const [orders, total] = await Promise.all([
    listDesignOrders({ search, status, skip, take }),
    countDesignOrders({ search, status })
  ]);

  return NextResponse.json({ orders, total, skip, take }, { status: 200 });
}
