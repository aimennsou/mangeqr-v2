import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { db } from '@/lib/db';
import {
  requireStripe,
  STRIPE_WEBHOOK_SECRET,
  planForPriceId,
} from '@/lib/stripe';

// Stripe needs the RAW request body to verify the signature, so this route
// must run on the Node runtime and read the body as text (not parsed JSON).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook — the SOURCE OF TRUTH for plan grants.
 *
 * Translates subscription lifecycle events into the app's plan model
 * (`plan` + `planRenewsAt` + `planPaymentMethod = ONLINE`), so the existing
 * `getEffectivePlan` / gating logic works unchanged:
 *  - active/renewed subscription  → set plan + planRenewsAt = current period end
 *  - canceled/unpaid subscription → revert plan to STARTER
 *
 * Handled events: customer.subscription.created|updated|deleted and
 * invoice.paid (renewals). Idempotent: every event just re-derives state from
 * the subscription and writes it.
 */
export async function POST(req: NextRequest) {
  const stripe = requireStripe();

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        // A renewal (or failed renewal) — re-sync from the linked subscription.
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(sub);
        }
        break;
      }
      default:
        // Ignore unrelated events.
        break;
    }
  } catch (err) {
    console.error(`Error handling webhook ${event.type}`, err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * Reconcile one Stripe subscription into the user's plan fields. Finds the user
 * by stripeCustomerId (falling back to the metadata.userId set at creation).
 */
async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const user =
    (await db.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    })) ??
    (subscription.metadata?.userId
      ? await db.user.findUnique({
          where: { id: subscription.metadata.userId },
          select: { id: true },
        })
      : null);

  if (!user) {
    console.warn(`Webhook: no user for customer ${customerId}`);
    return;
  }

  // Which plan does the subscription's price grant?
  const priceId = subscription.items.data[0]?.price?.id;
  const grantedPlan = priceId ? planForPriceId(priceId) : null;

  // Statuses that entitle the user to the paid plan.
  const active =
    subscription.status === 'active' || subscription.status === 'trialing';

  if (active && grantedPlan) {
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;
    await db.user.update({
      where: { id: user.id },
      data: {
        plan: grantedPlan,
        planPaymentMethod: 'ONLINE',
        planRenewsAt: periodEnd,
        stripeSubscriptionId: subscription.id,
      },
    });
    return;
  }

  // Canceled / unpaid / incomplete_expired → revert to the free tier. Keep the
  // stripeSubscriptionId as-is for canceled (period-end) so access persists via
  // planRenewsAt; only hard-revert when the subscription is truly gone.
  if (
    subscription.status === 'canceled' ||
    subscription.status === 'unpaid' ||
    subscription.status === 'incomplete_expired'
  ) {
    await db.user.update({
      where: { id: user.id },
      data: {
        plan: 'STARTER',
        planRenewsAt: null,
        stripeSubscriptionId: null,
      },
    });
  }
}
