import { UserRole } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { currentRole } from '@/lib/authentication';
import { listUsers, countUsers } from '@/data/superadmin';

/**
 * GET /api/superadmin/users (superadmin, S6).
 *
 * SUPERADMIN-gated endpoint that wraps `listUsers`/`countUsers` so the client
 * table can search and paginate. Non-superadmins get 403 — never trust the
 * client; this route re-checks the role server-side.
 *
 * Query params: `search` (string), `skip` (number), `take` (number).
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

  const [users, total] = await Promise.all([
    listUsers({ search, skip, take }),
    countUsers({ search })
  ]);

  return NextResponse.json({ users, total, skip, take }, { status: 200 });
}
