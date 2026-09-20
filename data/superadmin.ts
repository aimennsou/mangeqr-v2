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
  /** Stripe linkage — present when the user has an online subscription. */
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
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
        stripeCustomerId: true,
        stripeSubscriptionId: true,
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
      orderingEnabled: u.orderingEnabled,
      stripeCustomerId: u.stripeCustomerId,
      stripeSubscriptionId: u.stripeSubscriptionId
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


// -----------------------------------------------------------------------------
// Global metrics (superadmin dashboard)
// -----------------------------------------------------------------------------

// Monthly reference price per paid plan (EUR), used for a rough MRR estimate.
// Mirrors the marketing TIERS; annual subs are counted at their monthly-equivalent.
const PLAN_MONTHLY_EUR: Record<'PRO' | 'PREMIUM', number> = {
  PRO: 24,
  PREMIUM: 37
};

export interface SuperadminMetrics {
  totalUsers: number;
  suspendedUsers: number;
  /** Users on a paid plan whose subscription is still active (not expired). */
  activeSubscribers: number;
  /** Paid subscribers whose planRenewsAt is in the past. */
  expiredSubscribers: number;
  byPlan: { STARTER: number; PRO: number; PREMIUM: number };
  onlineSubscribers: number;
  cashSubscribers: number;
  /** Rough monthly recurring revenue estimate from ACTIVE paid subs (EUR). */
  estimatedMrr: number;
  totalRestaurants: number;
  totalMenus: number;
  totalDishes: number;
  totalDinerOrders: number;
  designOrders: {
    total: number;
    pending: number;
    inProgress: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  supportMessages: { total: number; unresolved: number };
}

/**
 * Compute the global superadmin dashboard metrics in one batch of parallel
 * count/aggregate queries. "Active subscriber" = paid plan with no expiry or a
 * future `planRenewsAt` (mirrors getEffectivePlan). Returns zeroed metrics on
 * error so the dashboard still renders.
 */
export async function getSuperadminMetrics(): Promise<SuperadminMetrics> {
  const now = new Date();
  const paidPlans = ['PRO', 'PREMIUM'] as const;
  const activeFilter = {
    OR: [{ planRenewsAt: null }, { planRenewsAt: { gt: now } }]
  };

  try {
    const [
      totalUsers,
      suspendedUsers,
      starter,
      proTotal,
      premiumTotal,
      proActive,
      premiumActive,
      paidActive,
      paidExpired,
      onlineActive,
      cashActive,
      totalRestaurants,
      totalMenus,
      totalDishes,
      totalDinerOrders,
      doTotal,
      doPending,
      doInProgress,
      doShipped,
      doDelivered,
      doCancelled,
      supportTotal,
      supportUnresolved
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { suspended: true } }),
      db.user.count({ where: { plan: 'STARTER' } }),
      db.user.count({ where: { plan: 'PRO' } }),
      db.user.count({ where: { plan: 'PREMIUM' } }),
      db.user.count({ where: { plan: 'PRO', ...activeFilter } }),
      db.user.count({ where: { plan: 'PREMIUM', ...activeFilter } }),
      db.user.count({ where: { plan: { in: paidPlans as unknown as ('PRO' | 'PREMIUM')[] }, ...activeFilter } }),
      db.user.count({ where: { plan: { in: paidPlans as unknown as ('PRO' | 'PREMIUM')[] }, planRenewsAt: { lt: now } } }),
      db.user.count({ where: { plan: { in: paidPlans as unknown as ('PRO' | 'PREMIUM')[] }, planPaymentMethod: 'ONLINE', ...activeFilter } }),
      db.user.count({ where: { plan: { in: paidPlans as unknown as ('PRO' | 'PREMIUM')[] }, planPaymentMethod: 'CASH', ...activeFilter } }),
      db.restaurant.count(),
      db.menu.count(),
      db.dish.count(),
      db.order.count(),
      db.designOrder.count(),
      db.designOrder.count({ where: { status: 'PENDING' } }),
      db.designOrder.count({ where: { status: 'IN_PROGRESS' } }),
      db.designOrder.count({ where: { status: 'SHIPPED' } }),
      db.designOrder.count({ where: { status: 'DELIVERED' } }),
      db.designOrder.count({ where: { status: 'CANCELLED' } }),
      db.supportMessage.count(),
      db.supportMessage.count({ where: { status: { not: 'RESOLVED' } } })
    ]);

    const estimatedMrr =
      proActive * PLAN_MONTHLY_EUR.PRO +
      premiumActive * PLAN_MONTHLY_EUR.PREMIUM;

    return {
      totalUsers,
      suspendedUsers,
      activeSubscribers: paidActive,
      expiredSubscribers: paidExpired,
      byPlan: { STARTER: starter, PRO: proTotal, PREMIUM: premiumTotal },
      onlineSubscribers: onlineActive,
      cashSubscribers: cashActive,
      estimatedMrr,
      totalRestaurants,
      totalMenus,
      totalDishes,
      totalDinerOrders,
      designOrders: {
        total: doTotal,
        pending: doPending,
        inProgress: doInProgress,
        shipped: doShipped,
        delivered: doDelivered,
        cancelled: doCancelled
      },
      supportMessages: { total: supportTotal, unresolved: supportUnresolved }
    };
  } catch {
    return {
      totalUsers: 0,
      suspendedUsers: 0,
      activeSubscribers: 0,
      expiredSubscribers: 0,
      byPlan: { STARTER: 0, PRO: 0, PREMIUM: 0 },
      onlineSubscribers: 0,
      cashSubscribers: 0,
      estimatedMrr: 0,
      totalRestaurants: 0,
      totalMenus: 0,
      totalDishes: 0,
      totalDinerOrders: 0,
      designOrders: {
        total: 0,
        pending: 0,
        inProgress: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      },
      supportMessages: { total: 0, unresolved: 0 }
    };
  }
}


// -----------------------------------------------------------------------------
// Support inbox
// -----------------------------------------------------------------------------

import type {
  SupportMessageStatus,
  SupportAuthorRole
} from '@prisma/client';

export interface SupportReplyRow {
  id: string;
  authorRole: SupportAuthorRole;
  authorName: string | null;
  body: string;
  createdAt: Date;
}

export interface SuperadminSupportMessageRow {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  message: string;
  status: SupportMessageStatus;
  createdAt: Date;
  replies: SupportReplyRow[];
}

interface ListSupportMessagesArgs {
  search?: string;
  status?: SupportMessageStatus;
  skip?: number;
  take?: number;
}

function buildSupportWhere(
  search?: string,
  status?: SupportMessageStatus
): Prisma.SupportMessageWhereInput {
  const where: Prisma.SupportMessageWhereInput = {};
  if (status) where.status = status;

  const term = search?.trim();
  if (term) {
    where.OR = [
      { email: { contains: term, mode: Prisma.QueryMode.insensitive } },
      { name: { contains: term, mode: Prisma.QueryMode.insensitive } },
      { message: { contains: term, mode: Prisma.QueryMode.insensitive } }
    ];
  }
  return where;
}

/**
 * List support messages for the SUPERADMIN inbox. Unresolved first (NEW then
 * READ, RESOLVED last is approximated by createdAt desc within the filter),
 * newest first. Optional search on name/email/message + status filter.
 */
export async function listSupportMessages({
  search,
  status,
  skip = 0,
  take = 20
}: ListSupportMessagesArgs = {}): Promise<SuperadminSupportMessageRow[]> {
  try {
    const rows = await db.supportMessage.findMany({
      where: buildSupportWhere(search, status),
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        message: true,
        status: true,
        createdAt: true,
        replies: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            authorRole: true,
            authorName: true,
            body: true,
            createdAt: true
          }
        }
      }
    });
    return rows;
  } catch {
    return [];
  }
}

/** Count support messages matching the (optional) filter — for pagination. */
export async function countSupportMessages({
  search,
  status
}: { search?: string; status?: SupportMessageStatus } = {}): Promise<number> {
  try {
    return await db.supportMessage.count({
      where: buildSupportWhere(search, status)
    });
  } catch {
    return 0;
  }
}


// -----------------------------------------------------------------------------
// Restaurant management (any owner)
// -----------------------------------------------------------------------------

export interface SuperadminRestaurantRow {
  id: string;
  name: string;
  address: string;
  phone: string;
  coverPhoto: string | null;
  subdomain: string | null;
  currency: string;
  wifi: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  google: string | null;
  menuCount: number;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: Date;
}

interface ListRestaurantsArgs {
  search?: string;
  skip?: number;
  take?: number;
}

function buildRestaurantWhere(search?: string): Prisma.RestaurantWhereInput {
  const term = search?.trim();
  if (!term) return {};
  return {
    OR: [
      { name: { contains: term, mode: Prisma.QueryMode.insensitive } },
      { address: { contains: term, mode: Prisma.QueryMode.insensitive } },
      { subdomain: { contains: term, mode: Prisma.QueryMode.insensitive } },
      { user: { email: { contains: term, mode: Prisma.QueryMode.insensitive } } },
      { user: { name: { contains: term, mode: Prisma.QueryMode.insensitive } } }
    ]
  };
}

/**
 * List all restaurants across every account for the SUPERADMIN console, with
 * owner info and a menu count. Newest first. Optional search on
 * name/address/subdomain/owner.
 */
export async function listRestaurantsForSuperadmin({
  search,
  skip = 0,
  take = 20
}: ListRestaurantsArgs = {}): Promise<SuperadminRestaurantRow[]> {
  try {
    const rows = await db.restaurant.findMany({
      where: buildRestaurantWhere(search),
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        coverPhoto: true,
        subdomain: true,
        currency: true,
        wifi: true,
        website: true,
        instagram: true,
        tiktok: true,
        google: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { menus: true } }
      }
    });

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      phone: r.phone,
      coverPhoto: r.coverPhoto,
      subdomain: r.subdomain,
      currency: r.currency,
      wifi: r.wifi,
      website: r.website,
      instagram: r.instagram,
      tiktok: r.tiktok,
      google: r.google,
      menuCount: r._count.menus,
      ownerId: r.user?.id ?? '',
      ownerName: r.user?.name ?? null,
      ownerEmail: r.user?.email ?? null,
      createdAt: r.createdAt
    }));
  } catch {
    return [];
  }
}

/** Count restaurants matching the (optional) search — for pagination. */
export async function countRestaurantsForSuperadmin({
  search
}: { search?: string } = {}): Promise<number> {
  try {
    return await db.restaurant.count({ where: buildRestaurantWhere(search) });
  } catch {
    return 0;
  }
}


// -----------------------------------------------------------------------------
// Lead-gen funnel leads (paid ads)
// -----------------------------------------------------------------------------

import type {
  LeadStatus,
  LeadCallStatus,
  LeadDeliveryStatus,
  LeadOrderStatus,
} from '@prisma/client';

export interface LeadActivityRow {
  id: string;
  kind: string;
  body: string;
  authorName: string | null;
  createdAt: Date;
}

export interface SuperadminLeadRow {
  id: string;
  restaurantName: string;
  locale: string;
  currency: string;
  designName: string | null;
  quantity: number | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  status: LeadStatus;
  // CRM follow-up (#10)
  callStatus: LeadCallStatus;
  callAttempts: number;
  deliveryStatus: LeadDeliveryStatus;
  orderStatus: LeadOrderStatus;
  assignedToId: string | null;
  assignedToName: string | null;
  followUpNotes: string | null;
  nextFollowUpAt: Date | null;
  lastContactedAt: Date | null;
  // Conversion (#12)
  convertedUserId: string | null;
  convertedRestaurantId: string | null;
  convertedAt: Date | null;
  createdAt: Date;
  /** Number of categories in the built menu (from the JSON), for a quick sense. */
  categoryCount: number;
  /** Recent activity timeline (newest last). */
  activities: LeadActivityRow[];
}

interface ListLeadsArgs {
  search?: string;
  status?: LeadStatus;
  skip?: number;
  take?: number;
}

function buildLeadWhere(
  search?: string,
  status?: LeadStatus
): Prisma.LeadMenuWhereInput {
  const where: Prisma.LeadMenuWhereInput = {};
  if (status) where.status = status;
  const term = search?.trim();
  if (term) {
    where.OR = [
      { restaurantName: { contains: term, mode: Prisma.QueryMode.insensitive } },
      { contactName: { contains: term, mode: Prisma.QueryMode.insensitive } },
      { contactPhone: { contains: term, mode: Prisma.QueryMode.insensitive } },
      { contactEmail: { contains: term, mode: Prisma.QueryMode.insensitive } }
    ];
  }
  return where;
}

/** List funnel leads for the SUPERADMIN, newest first. */
export async function listLeads({
  search,
  status,
  skip = 0,
  take = 20
}: ListLeadsArgs = {}): Promise<SuperadminLeadRow[]> {
  try {
    const rows = await db.leadMenu.findMany({
      where: buildLeadWhere(search, status),
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: LEAD_SELECT,
    });
    return rows.map(mapLeadRow);
  } catch {
    return [];
  }
}

/** Shared select for lead rows (list + detail). */
const LEAD_SELECT = {
  id: true,
  restaurantName: true,
  locale: true,
  currency: true,
  data: true,
  designName: true,
  quantity: true,
  contactName: true,
  contactPhone: true,
  contactEmail: true,
  notes: true,
  status: true,
  callStatus: true,
  callAttempts: true,
  deliveryStatus: true,
  orderStatus: true,
  assignedToId: true,
  assignedTo: { select: { name: true, email: true } },
  followUpNotes: true,
  nextFollowUpAt: true,
  lastContactedAt: true,
  convertedUserId: true,
  convertedRestaurantId: true,
  convertedAt: true,
  createdAt: true,
  activities: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      kind: true,
      body: true,
      authorName: true,
      createdAt: true,
    },
  },
} satisfies Prisma.LeadMenuSelect;

type LeadWithSelect = Prisma.LeadMenuGetPayload<{ select: typeof LEAD_SELECT }>;

function mapLeadRow(r: LeadWithSelect): SuperadminLeadRow {
  const cats = (r.data as { categories?: unknown[] })?.categories;
  return {
    id: r.id,
    restaurantName: r.restaurantName,
    locale: r.locale,
    currency: r.currency,
    designName: r.designName,
    quantity: r.quantity,
    contactName: r.contactName,
    contactPhone: r.contactPhone,
    contactEmail: r.contactEmail,
    notes: r.notes,
    status: r.status,
    callStatus: r.callStatus,
    callAttempts: r.callAttempts,
    deliveryStatus: r.deliveryStatus,
    orderStatus: r.orderStatus,
    assignedToId: r.assignedToId,
    assignedToName: r.assignedTo?.name ?? r.assignedTo?.email ?? null,
    followUpNotes: r.followUpNotes,
    nextFollowUpAt: r.nextFollowUpAt,
    lastContactedAt: r.lastContactedAt,
    convertedUserId: r.convertedUserId,
    convertedRestaurantId: r.convertedRestaurantId,
    convertedAt: r.convertedAt,
    createdAt: r.createdAt,
    categoryCount: Array.isArray(cats) ? cats.length : 0,
    activities: r.activities.map((a) => ({
      id: a.id,
      kind: a.kind,
      body: a.body,
      authorName: a.authorName,
      createdAt: a.createdAt,
    })),
  };
}

/** Fetch a single lead with full CRM detail. */
export async function getLead(id: string): Promise<SuperadminLeadRow | null> {
  try {
    const row = await db.leadMenu.findUnique({
      where: { id },
      select: LEAD_SELECT,
    });
    return row ? mapLeadRow(row) : null;
  } catch {
    return null;
  }
}

/** List STAFF/SUPERADMIN users that a lead can be assigned to. */
export interface StaffOption {
  id: string;
  name: string | null;
  email: string | null;
}

export async function listStaff(): Promise<StaffOption[]> {
  try {
    return await db.user.findMany({
      where: { role: { in: ['STAFF', 'SUPERADMIN'] } },
      orderBy: { email: 'asc' },
      select: { id: true, name: true, email: true },
    });
  } catch {
    return [];
  }
}

/** Count funnel leads matching the (optional) filter — for pagination. */
export async function countLeads({
  search,
  status
}: { search?: string; status?: LeadStatus } = {}): Promise<number> {
  try {
    return await db.leadMenu.count({ where: buildLeadWhere(search, status) });
  } catch {
    return 0;
  }
}


// -----------------------------------------------------------------------------
// Plan-upgrade requests (cash / Algeria) — #2
// -----------------------------------------------------------------------------

import type { PlanUpgradeStatus } from '@prisma/client';

export interface SuperadminUpgradeRequestRow {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  currentPlan: Plan;
  targetPlan: Plan;
  frequency: string;
  priceLabel: string | null;
  currency: string;
  contactPhone: string | null;
  note: string | null;
  status: PlanUpgradeStatus;
  createdAt: Date;
}

/** List cash plan-upgrade requests for the SUPERADMIN, newest first. */
export async function listUpgradeRequests({
  status,
  skip = 0,
  take = 100,
}: { status?: PlanUpgradeStatus; skip?: number; take?: number } = {}): Promise<
  SuperadminUpgradeRequestRow[]
> {
  try {
    const rows = await db.planUpgradeRequest.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        user: { select: { name: true, email: true, plan: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user?.name ?? null,
      userEmail: r.user?.email ?? null,
      currentPlan: r.user?.plan ?? 'STARTER',
      targetPlan: r.targetPlan,
      frequency: r.frequency,
      priceLabel: r.priceLabel,
      currency: r.currency,
      contactPhone: r.contactPhone,
      note: r.note,
      status: r.status,
      createdAt: r.createdAt,
    }));
  } catch {
    return [];
  }
}

/** Count pending upgrade requests — for the dashboard/nav badge. */
export async function countPendingUpgradeRequests(): Promise<number> {
  try {
    return await db.planUpgradeRequest.count({ where: { status: 'PENDING' } });
  } catch {
    return 0;
  }
}
