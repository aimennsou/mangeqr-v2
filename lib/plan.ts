import type { Plan } from '@prisma/client';

/**
 * Per-plan feature limits. Mirrors the marketing tiers in `config/index.ts`
 * (Starter / Pro / Premium). `Infinity` means unlimited.
 *
 * These are the single source of truth for gating (menus, restaurants,
 * campaigns). Routes should call `getPlanLimits(user.plan)` instead of
 * hardcoding numbers.
 */
export interface PlanLimits {
  restaurants: number;
  menus: number;
  campaigns: number;
  /** Whether the MangeQR branding can be removed from generated artifacts. */
  removeBranding: boolean;
  /**
   * Number of team MEMBERS allowed IN ADDITION to the owner (the owner never
   * counts against this). Seats are enforced against the owner's EFFECTIVE plan
   * (see `getEffectivePlan`), so an expired paid plan collapses to STARTER and
   * therefore to 0 seats — existing members then exceed the limit and no new
   * ones can be added until the plan is renewed.
   */
  seats: number;
}

const LIMITS: Record<Plan, PlanLimits> = {
  STARTER: { restaurants: 1, menus: 7, campaigns: 1, removeBranding: false, seats: 0 },
  PRO: { restaurants: 3, menus: 21, campaigns: 4, removeBranding: false, seats: 3 },
  PREMIUM: {
    restaurants: Infinity,
    menus: Infinity,
    campaigns: Infinity,
    removeBranding: true,
    seats: 10,
  },
};

export function getPlanLimits(plan: Plan | null | undefined): PlanLimits {
  // Default to the most restrictive tier when the plan is missing/unknown.
  return LIMITS[plan ?? 'STARTER'] ?? LIMITS.STARTER;
}

/**
 * Resolve a user's effective plan, downgrading to STARTER when the plan has
 * expired (`planRenewsAt` in the past). Since plans are set manually / by cash
 * payment (no Stripe), expiry is how a paid tier lapses back to free.
 */
export function getEffectivePlan(user: {
  plan?: Plan | null;
  planRenewsAt?: Date | string | null;
}): Plan {
  const plan = user.plan ?? 'STARTER';
  if (plan === 'STARTER') return 'STARTER';
  if (user.planRenewsAt) {
    const expiry = new Date(user.planRenewsAt);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return 'STARTER';
    }
  }
  return plan;
}
