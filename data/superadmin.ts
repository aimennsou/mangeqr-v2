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
  /** FEAT-1/D16: whether ordering is enabled for this account. */
  orderingEnabled: boolean;
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
        orderingEnabled: true,
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
      restaurantCount: u._count.restaurants,
      orderingEnabled: u.orderingEnabled
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


// -----------------------------------------------------------------------------
// Design-order tracking (FEAT-6)
// -----------------------------------------------------------------------------

import type { DesignOrderStatus } from '@prisma/client';

/**
 * A design-order row for the SUPERADMIN fulfillment console. Joins the owner
 * (who placed it) and the restaurant (whose menu the QR points to) for display.
 * These are ALL design orders across every account — not workspace-scoped —
 * because the superadmin fulfills them centrally.
 */
export interface SuperadminDesignOrderRow {
  id: string;
  designId: string;
  designName: string;
  quantity: number;
  status: DesignOrderStatus;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  deliveryMethod: string | null;
  notes: string | null;
  restaurantId: string;
  restaurantName: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ListDesignOrdersArgs {
  search?: string;
  status?: DesignOrderStatus;
  skip?: number;
  take?: number;
}

/**
 * Build the shared filter for the superadmin design-order list/count. Search
 * matches (case-insensitive) on contact name/email, restaurant name, or design
 * name. An optional exact `status` narrows further. Empty search matches all.
 */
function buildDesignOrderWhere(
  search?: string,
  status?: DesignOrderStatus
): Prisma.DesignOrderWhereInput {
  const where: Prisma.DesignOrderWhereInput = {};
  if (status) {
    where.status = status;
  }
  const term = search?.trim();
  if (term) {
    where.OR = [
      { contactName: { contains: term, mode: Prisma.QueryMode.insensitive } },
      { contactEmail: { contains: term, mode: Prisma.QueryMode.insensitive } },
      { designName: { contains: term, mode: Prisma.QueryMode.insensitive } },
      {
        restaurant: {
          name: { contains: term, mode: Prisma.QueryMode.insensitive }
        }
      }
    ];
  }
  return where;
}

/**
 * List design orders for the superadmin console, newest first, joining the
 * owner and restaurant for display. Case-insensitive search + optional status
 * filter. Returns `[]` on error (never throws to the caller).
 */
export async function listDesignOrders({
  search,
  status,
  skip = 0,
  take = 20
}: ListDesignOrdersArgs = {}): Promise<SuperadminDesignOrderRow[]> {
  try {
    const orders = await db.designOrder.findMany({
      where: buildDesignOrderWhere(search, status),
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        restaurant: { select: { name: true } },
        user: { select: { name: true, email: true } }
      }
    });

    return orders.map((o) => ({
      id: o.id,
      designId: o.designId,
      designName: o.designName,
      quantity: o.quantity,
      status: o.status,
      contactName: o.contactName,
      contactEmail: o.contactEmail,
      contactPhone: o.contactPhone,
      deliveryMethod: o.deliveryMethod,
      notes: o.notes,
      restaurantId: o.restaurantId,
      restaurantName: o.restaurant?.name ?? null,
      ownerName: o.user?.name ?? null,
      ownerEmail: o.user?.email ?? null,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt
    }));
  } catch {
    return [];
  }
}

/** Count design orders matching the (optional) search/status — for pagination. */
export async function countDesignOrders({
  search,
  status
}: { search?: string; status?: DesignOrderStatus } = {}): Promise<number> {
  try {
    return await db.designOrder.count({
      where: buildDesignOrderWhere(search, status)
    });
  } catch {
    return 0;
  }
}
