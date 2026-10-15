import 'server-only';

import Stripe from 'stripe';
import type { Plan } from '@prisma/client';

/**
 * Server-side Stripe client + config for the subscription billing integration.
 *
 * Keys come from the environment (never hardcoded):
 *  - STRIPE_SECRET               server secret key (sk_test_… / sk_live_…)
 *  - STRIPE_WEBHOOK_SECRET       webhook signing secret (whsec_…)
 *  - STRIPE_PRICE_*              the four recurring EUR price ids
 *  - NEXT_PUBLIC_STRIPE_PUBLISH_KEY  publishable key (client)
 *
 * `stripe` is null until a secret key is configured, and `isStripeEnabled()`
 * lets the app degrade gracefully (cash/contact path still works) when billing
 * isn't set up.
 */

const secret = process.env.STRIPE_SECRET;

export const stripe = secret
  ? new Stripe(secret, {
      // Pin the API version for stable webhook payloads across deploys.
      apiVersion: '2025-01-27.acacia',
      appInfo: { name: 'MangeQR' },
    })
  : null;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

export function isStripeEnabled(): boolean {
  return !!stripe;
}

/** Assert Stripe is configured; throws a clear error otherwise. */
export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error(
      'Stripe is not configured. Set STRIPE_SECRET in the environment.'
    );
  }
  return stripe;
}

export type BillingFrequency = 'mensuel' | 'annuel';

/**
 * The paid plans we sell (Starter is free — no price). Maps a plan + billing
 * frequency to its recurring EUR Stripe Price id from the environment.
 */
export const PRICE_IDS: Record<
  Exclude<Plan, 'STARTER' | 'FREE'>,
  Record<BillingFrequency, string | undefined>
> = {
  PRO: {
    mensuel: process.env.STRIPE_PRICE_PRO_MONTHLY,
    annuel: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  PREMIUM: {
    mensuel: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    annuel: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
  },
};

/** Resolve the Stripe Price id for a paid plan + frequency (or undefined). */
export function priceIdFor(
  plan: Exclude<Plan, 'STARTER' | 'FREE'>,
  frequency: BillingFrequency
): string | undefined {
  return PRICE_IDS[plan]?.[frequency];
}

/** Reverse lookup: given a Stripe Price id, which plan does it grant? */
export function planForPriceId(priceId: string): Plan | null {
  for (const plan of ['PRO', 'PREMIUM'] as const) {
    const freqs = PRICE_IDS[plan];
    if (freqs.mensuel === priceId || freqs.annuel === priceId) return plan;
  }
  return null;
}
