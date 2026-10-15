import { UserRole } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { currentRole } from '@/lib/authentication';
import {
  listRestaurantsForSuperadmin,
  countRestaurantsForSuperadmin
} from '@/data/superadmin';

/**
 * GET /api/superadmin/restaurants — SUPERADMIN-gated list of ALL restaurants
 * (any owner) with search + pagination. Non-superadmins get 403; the role is
 * re-checked server-side (never trust the client).
 *
 * Query params: `search` (string), `skip` (number), `take` (number, ≤100).
 */
export async function GET(req: NextRequest) {
  const role = await currentRole();
  if (role !== UserRole.SUPERADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') ?? undefined;

  const parsedSkip = Number.parseInt(searchParams.get('skip') ?? '0', 10);
  const parsedTake = Number.parseInt(searchParams.get('take') ?? '20', 10);

  const skip = Number.isNaN(parsedSkip) || parsedSkip < 0 ? 0 : parsedSkip;
  const take =
    Number.isNaN(parsedTake) || parsedTake <= 0 || parsedTake > 100
      ? 20
      : parsedTake;

  const [restaurants, total] = await Promise.all([
    listRestaurantsForSuperadmin({ search, skip, take }),
    countRestaurantsForSuperadmin({ search })
  ]);

  return NextResponse.json({ restaurants, total, skip, take }, { status: 200 });
}
