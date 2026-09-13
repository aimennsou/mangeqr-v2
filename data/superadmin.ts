import { Prisma } from '@prisma/client';
import type { Plan, PlanPaymentMethod, UserRole } from '@prisma/client';

import { db } from '@/lib/db';

/**
 * Superadmin data layer (server-only reads).
 *
 * Powers the SUPERADMIN console user list (superadmin, S5): search + paginate
 * all users with the summary fields the table needs. These are plain server
 * reads — never import into a client component. Access control lives in the
 * caller (the SUPERADMIN-gated action / API route / page); this module does not
 * gate.
 */

export interface SuperadminUserRow {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  plan: Plan;
  planPaymentMethod: PlanPaymentMethod;
  planRenewsAt: Date | null;
  suspended: boolean;
  restaurantCount: number;
}

interface ListUsersArgs {
  search?: string;
  skip?: number;
  take?: number;
}

/**
 * Build the case-insensitive search filter shared by listUsers/countUsers.
 * Matches on email OR name. An empty/whitespace search matches everything.
 */
function buildWhere(search?: string): Prisma.UserWhereInput {
  const term = search?.trim();
  if (!term) {
    return {};
  }

  return {
    OR: [
      { email: { contains: term, mode: Prisma.QueryMode.insensitive } },
      { name: { contains: term, mode: Prisma.QueryMode.insensitive } }
    ]
  };
}

/**
 * List users for the superadmin console, newest first. Returns summary rows
 * including a `restaurantCount` (via `_count`). Case-insensitive search on
 * email/name.
 */
export async function listUsers({
  search,
  skip = 0,
  take = 20
}: ListUsersArgs = {}): Promise<SuperadminUserRow[]> {
  try {
    const users = await db.user.findMany({
      where: buildWhere(search),
      // User has no createdAt column; order by email for a stable listing.
      orderBy: { email: 'asc' },
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        planPaymentMethod: true,
        planRenewsAt: true,
        suspended: true,
        _count: { select: { restaurants: true } }
      }
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.plan,
      planPaymentMethod: u.planPaymentMethod,
      planRenewsAt: u.planRenewsAt,
      suspended: u.suspended,
      restaurantCount: u._count.restaurants
    }));
  } catch {
    return [];
  }
}

/** Count users matching the (optional) search — used for pagination. */
export async function countUsers({
  search
}: { search?: string } = {}): Promise<number> {
  try {
    return await db.user.count({ where: buildWhere(search) });
  } catch {
    return 0;
  }
}
