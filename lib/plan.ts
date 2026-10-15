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
  // Free tier (no payment): a minimal allowance so the account works but is
  // clearly the entry, unpaid level.
  FREE: { restaurants: 1, menus: 1, campaigns: 0, removeBranding: false, seats: 0 },
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

/** Number of days a FREE (trial) plan stays active before it must be upgraded. */
export const FREE_TRIAL_DAYS = 30;

/**
 * Resolve a user's effective plan.
 *
 * - STARTER is the legacy non-expiring entry tier (kept as-is).
 * - Paid plans (PRO/PREMIUM) collapse to STARTER when their `planRenewsAt` is
 *   in the past (cash/manual expiry).
 * - FREE is a TIME-LIMITED trial (see `FREE_TRIAL_DAYS`): once `planRenewsAt`
 *   passes, the account must move to a paid plan. We keep the plan value at
 *   FREE (there is nothing lower) but callers detect the lapse via
 *   `isPlanExpired` / `isTrialExpired`, and gating tightens accordingly.
 */
export function getEffectivePlan(user: {
  plan?: Plan | null;
  planRenewsAt?: Date | string | null;
}): Plan {
  const plan = user.plan ?? 'FREE';
  if (plan === 'STARTER') return 'STARTER';
  if (plan === 'FREE') return 'FREE'; // stays FREE; expiry surfaced separately
  if (user.planRenewsAt) {
    const expiry = new Date(user.planRenewsAt);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return 'STARTER';
    }
  }
  return plan;
}

/**
 * Whether a plan with an expiry date has lapsed. STARTER never expires; FREE and
 * paid plans expire when `planRenewsAt` is in the past. For FREE this means the
 * trial ended and the account must upgrade.
 */
export function isPlanExpired(user: {
  plan?: Plan | null;
  planRenewsAt?: Date | string | null;
}): boolean {
  const plan = user.plan ?? 'FREE';
  if (plan === 'STARTER') return false;
  if (!user.planRenewsAt) return false;
  const expiry = new Date(user.planRenewsAt);
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now();
}

/** Convenience: the FREE trial has ended (FREE plan whose expiry passed). */
export function isTrialExpired(user: {
  plan?: Plan | null;
  planRenewsAt?: Date | string | null;
}): boolean {
  return (user.plan ?? 'FREE') === 'FREE' && isPlanExpired(user);
}
