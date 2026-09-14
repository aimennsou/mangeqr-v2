'use server';

import type { Plan } from '@prisma/client';

import { db } from '@/lib/db';
import { currentUserId } from '@/lib/authentication';
import {
  requireStripe,
  isStripeEnabled,
  priceIdFor,
  type BillingFrequency,
} from '@/lib/stripe';

/**
 * Stripe subscription billing (Elements flow, EUR).
 *
 * `createSubscription` returns a PaymentIntent client secret that the client
 * confirms with the Payment Element. The actual plan grant happens in the
 * webhook (invoice.paid / customer.subscription.*), which is the source of
 * truth — never trust the client to have paid. These actions only set up the
 * Stripe objects and persist the customer/subscription ids.
 */

/** Ensure the user has a Stripe Customer; create + persist one if missing. */
async function getOrCreateCustomerId(userId: string): Promise<string> {
  const stripe = requireStripe();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, stripeCustomerId: true },
  });
  if (!user) throw new Error('User not found.');

  if (user.stripeCustomerId) {
    // Verify it still exists (test data can be wiped); recreate if deleted.
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!('deleted' in existing) || !existing.deleted) {
        return user.stripeCustomerId;
      }
    } catch {
      /* fall through and recreate */
    }
  }

  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: { userId },
  });
  await db.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

interface CreateSubscriptionResult {
  error?: string;
  clientSecret?: string;
  subscriptionId?: string;
}

/**
 * Start (or restart) a subscription for the current owner on the given paid
 * plan + frequency, using `payment_behavior: default_incomplete` so the first
 * invoice's PaymentIntent must be confirmed client-side with the Payment
 * Element. Returns that PaymentIntent's client secret.
 */
export async function createSubscription(
  plan: Exclude<Plan, 'STARTER'>,
  frequency: BillingFrequency
): Promise<CreateSubscriptionResult> {
  if (!isStripeEnabled()) {
    return { error: 'Le paiement en ligne n’est pas disponible.' };
  }

  const userId = await currentUserId();
  if (!userId) return { error: 'Non autorisé.' };

  const priceId = priceIdFor(plan, frequency);
  if (!priceId) {
    return { error: 'Tarif indisponible. Contactez le support.' };
  }

  try {
    const stripe = requireStripe();
    const customerId = await getOrCreateCustomerId(userId);

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      // Expand the first invoice's PaymentIntent to hand its client secret to
      // the Payment Element.
      expand: ['latest_invoice.payment_intent'],
      metadata: { userId, plan },
    });

    // Persist the (incomplete) subscription id so the webhook + cancel can find it.
    await db.user.update({
      where: { id: userId },
      data: { stripeSubscriptionId: subscription.id },
    });

    const invoice = subscription.latest_invoice;
    const paymentIntent =
      invoice && typeof invoice !== 'string'
        ? invoice.payment_intent
        : null;
    const clientSecret =
      paymentIntent && typeof paymentIntent !== 'string'
        ? paymentIntent.client_secret
        : null;

    if (!clientSecret) {
      return { error: 'Impossible d’initialiser le paiement.' };
    }

    return { clientSecret, subscriptionId: subscription.id };
  } catch (error) {
    console.error('createSubscription error', error);
    return { error: 'Une erreur est survenue. Réessayez.' };
  }
}

/**
 * Cancel the current owner's subscription at period end (they keep access until
 * `planRenewsAt`). The webhook flips the plan back to STARTER when the
 * subscription actually ends.
 */
export async function cancelSubscription(): Promise<{
  error?: string;
  success?: string;
}> {
  if (!isStripeEnabled()) return { error: 'Indisponible.' };

  const userId = await currentUserId();
  if (!userId) return { error: 'Non autorisé.' };

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true },
  });
  if (!user?.stripeSubscriptionId) {
    return { error: 'Aucun abonnement actif.' };
  }

  try {
    const stripe = requireStripe();
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    return {
      success:
        'Abonnement annulé. Vous gardez l’accès jusqu’à la fin de la période.',
    };
  } catch (error) {
    console.error('cancelSubscription error', error);
    return { error: 'Impossible d’annuler l’abonnement.' };
  }
}
