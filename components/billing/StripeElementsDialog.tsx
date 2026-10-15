'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createSubscription } from '@/actions/stripe';
import type { BillingFrequency } from '@/lib/stripe';

// Single Stripe.js loader instance (publishable key is public).
const publishKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY;
const stripePromise: Promise<StripeJs | null> | null = publishKey
  ? loadStripe(publishKey)
  : null;

type PaidPlan = 'PRO' | 'PREMIUM';

interface StripeElementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PaidPlan;
  frequency: BillingFrequency;
  planLabel: string;
  priceLabel: string;
  /** Called after a successful payment (parent can refresh / toast). */
  onSuccess?: () => void;
}

/**
 * In-app subscription checkout using Stripe Elements, themed to the MangeQR
 * editorial UI. Creates the subscription server-side (default_incomplete),
 * mounts the Payment Element with the returned client secret, and confirms the
 * first invoice's PaymentIntent. The plan grant is finalized by the webhook.
 */
export default function StripeElementsDialog({
  open,
  onOpenChange,
  plan,
  frequency,
  planLabel,
  priceLabel,
  onSuccess,
}: StripeElementsDialogProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  // Create the subscription (and get the client secret) when the dialog opens.
  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setInitError(null);
      return;
    }
    let cancelled = false;
    setInitializing(true);
    setInitError(null);
    createSubscription(plan, frequency)
      .then((res) => {
        if (cancelled) return;
        if (res.error || !res.clientSecret) {
          setInitError(res.error ?? 'Erreur d’initialisation.');
          return;
        }
        setClientSecret(res.clientSecret);
      })
      .catch(() => {
        if (!cancelled) setInitError('Une erreur est survenue.');
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, plan, frequency]);

  // Elements appearance tuned to the app tokens (gold accent, soft radius).
  const options = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: 'stripe' as const,
              variables: {
                colorPrimary: '#facc15',
                colorText: '#1a1a1a',
                colorDanger: '#dc2626',
                fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                borderRadius: '10px',
                spacingUnit: '4px',
              },
            },
          }
        : undefined,
    [clientSecret]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[460px]">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="font-serif-display text-2xl font-medium tracking-tight">
            Passer au forfait {planLabel}
          </DialogTitle>
          <DialogDescription>
            {priceLabel} · abonnement {frequency}, résiliable à tout moment.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          {initializing ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Préparation du paiement…
            </div>
          ) : initError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-red-600">{initError}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => onOpenChange(false)}
              >
                Fermer
              </Button>
            </div>
          ) : clientSecret && stripePromise && options ? (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm
                planLabel={planLabel}
                onDone={() => {
                  onOpenChange(false);
                  onSuccess?.();
                }}
              />
            </Elements>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Paiement indisponible.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** The inner form (must be a child of <Elements> to use the hooks). */
function CheckoutForm({
  planLabel,
  onDone,
}: {
  planLabel: string;
  onDone: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message ?? 'Le paiement a échoué.');
      setSubmitting(false);
      return;
    }

    if (
      paymentIntent &&
      (paymentIntent.status === 'succeeded' ||
        paymentIntent.status === 'processing')
    ) {
      setSucceeded(true);
      toast.success('Paiement confirmé. Votre forfait est en cours d’activation.');
      // Give the webhook a moment, then let the parent refresh.
      setTimeout(onDone, 1400);
      return;
    }

    setSubmitting(false);
  };

  if (succeeded) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <p className="font-medium text-foreground">
          Bienvenue sur {planLabel} !
        </p>
        <p className="text-sm text-muted-foreground">
          Votre forfait s’active dans quelques secondes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />

      <Button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Paiement…
          </>
        ) : (
          'Payer et activer'
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Paiement sécurisé par Stripe.
      </p>
    </form>
  );
}
