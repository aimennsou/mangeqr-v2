'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ArrowUpRight, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import StripeElementsDialog from '@/components/billing/StripeElementsDialog';
import { cancelSubscription } from '@/actions/stripe';
import type { BillingFrequency } from '@/lib/stripe';

type PaidPlan = 'PRO' | 'PREMIUM';

const PLAN_LABEL: Record<PaidPlan, string> = { PRO: 'Pro', PREMIUM: 'Premium' };
const PRICE: Record<PaidPlan, Record<BillingFrequency, string>> = {
  PRO: { mensuel: '35 € / mois', annuel: '350 € / an' },
  PREMIUM: { mensuel: '49 € / mois', annuel: '490 € / an' },
};

/**
 * Client billing controls for the account PlanCard. When Stripe is configured,
 * lets the owner subscribe online (Elements dialog) or cancel a current online
 * subscription. When Stripe is off, renders nothing (the card keeps its
 * cash/contact note). The grant itself is finalized by the webhook.
 */
export default function BillingActions({
  stripeEnabled,
  isPaidOnline,
}: {
  stripeEnabled: boolean;
  /** True when the current plan is a paid ONLINE (Stripe) subscription. */
  isPaidOnline: boolean;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<PaidPlan>('PRO');
  const [frequency, setFrequency] = useState<BillingFrequency>('mensuel');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCancelling, startCancel] = useTransition();

  if (!stripeEnabled) return null;

  const handleCancel = () => {
    startCancel(async () => {
      const res = await cancelSubscription();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Abonnement annulé.');
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <p className="text-sm font-semibold">
        {isPaidOnline ? 'Gérer l’abonnement' : 'Passer à un forfait supérieur'}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={plan} onValueChange={(v) => setPlan(v as PaidPlan)}>
          <SelectTrigger className="sm:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRO">Pro</SelectItem>
            <SelectItem value="PREMIUM">Premium</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={frequency}
          onValueChange={(v) => setFrequency(v as BillingFrequency)}
        >
          <SelectTrigger className="sm:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mensuel">Mensuel</SelectItem>
            <SelectItem value="annuel">Annuel</SelectItem>
          </SelectContent>
        </Select>

        <Button
          className="flex-1 bg-yellow-400 text-black hover:bg-yellow-400/90"
          onClick={() => setDialogOpen(true)}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isPaidOnline ? 'Changer de forfait' : 'S’abonner'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {PLAN_LABEL[plan]} · {PRICE[plan][frequency]}
      </p>

      {isPaidOnline ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Annuler l’abonnement
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler l’abonnement ?</AlertDialogTitle>
              <AlertDialogDescription>
                Vous conservez l’accès à votre forfait jusqu’à la fin de la
                période déjà payée, puis vous repassez au forfait Starter.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Retour</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Confirmer l’annulation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      <StripeElementsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={plan}
        frequency={frequency}
        planLabel={PLAN_LABEL[plan]}
        priceLabel={PRICE[plan][frequency]}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
