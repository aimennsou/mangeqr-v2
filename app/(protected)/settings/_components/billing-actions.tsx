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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import StripeElementsDialog from '@/components/billing/StripeElementsDialog';
import { cancelSubscription } from '@/actions/stripe';
import { requestPlanUpgrade } from '@/actions/plan-upgrade';
import { getPlanPriceLabel } from '@/config';
import type { BillingFrequency } from '@/lib/stripe';
import type { Plan } from '@prisma/client';

type PaidPlan = 'PRO' | 'PREMIUM';

const PLAN_LABEL: Record<PaidPlan, string> = { PRO: 'Pro', PREMIUM: 'Premium' };

/**
 * Client billing controls for the account PlanCard. When Stripe is configured,
 * lets the owner subscribe online (Elements dialog) or cancel a current online
 * subscription. When Stripe is off, renders nothing (the card keeps its
 * cash/contact note). The grant itself is finalized by the webhook.
 */
export default function BillingActions({
  stripeEnabled,
  isPaidOnline,
  isAlgerian = false,
  currentPlan = 'STARTER',
}: {
  stripeEnabled: boolean;
  /** True when the current plan is a paid ONLINE (Stripe) subscription. */
  isPaidOnline: boolean;
  /** #2: Algerian (DZD) account → cash upgrade-request flow. */
  isAlgerian?: boolean;
  /** Current effective plan (to hide upgrades that aren't upgrades). */
  currentPlan?: Plan;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<PaidPlan>('PRO');
  const [frequency, setFrequency] = useState<BillingFrequency>('mensuel');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCancelling, startCancel] = useTransition();

  // Currency-aware price label. EUR is the Stripe price; DZD for Algerian.
  const priceLabel = (p: PaidPlan, f: BillingFrequency) =>
    getPlanPriceLabel(p, f, isAlgerian ? 'DINAR' : 'EURO');

  // #2: Algerian accounts pay in cash — show a DZD upgrade REQUEST flow instead
  // of the Stripe checkout, whatever Stripe's config is.
  if (isAlgerian) {
    return (
      <AlgerianUpgradeRequest
        plan={plan}
        setPlan={setPlan}
        frequency={frequency}
        setFrequency={setFrequency}
        priceLabel={priceLabel}
        currentPlan={currentPlan}
      />
    );
  }

  if (!stripeEnabled) return null;

  const PRICE: Record<PaidPlan, Record<BillingFrequency, string>> = {
    PRO: {
      mensuel: priceLabel('PRO', 'mensuel'),
      annuel: priceLabel('PRO', 'annuel'),
    },
    PREMIUM: {
      mensuel: priceLabel('PREMIUM', 'mensuel'),
      annuel: priceLabel('PREMIUM', 'annuel'),
    },
  };

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


/**
 * #2 — Algerian (DZD) cash upgrade request. Instead of Stripe, the owner picks a
 * plan/frequency (DZD prices), optionally leaves a phone + note, and submits a
 * REQUEST the back-office follows up on (call + take payment).
 */
function AlgerianUpgradeRequest({
  plan,
  setPlan,
  frequency,
  setFrequency,
  priceLabel,
  currentPlan,
}: {
  plan: PaidPlan;
  setPlan: (p: PaidPlan) => void;
  frequency: BillingFrequency;
  setFrequency: (f: BillingFrequency) => void;
  priceLabel: (p: PaidPlan, f: BillingFrequency) => string;
  currentPlan: Plan;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    startTransition(async () => {
      const res = await requestPlanUpgrade({
        targetPlan: plan,
        frequency,
        contactPhone: phone,
        note,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Demande envoyée.');
      setPhone('');
      setNote('');
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <p className="text-sm font-semibold">Passer à un forfait supérieur</p>
      <p className="text-xs text-muted-foreground">
        Paiement en espèces (Algérie). Envoyez une demande : notre équipe vous
        appelle pour finaliser votre forfait.
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
      </div>

      <p className="text-xs text-muted-foreground">
        {PLAN_LABEL[plan]} · {priceLabel(plan, frequency)}
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Téléphone (pour vous rappeler)"
        />
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optionnel)"
        />
      </div>

      <Button
        onClick={onSubmit}
        disabled={isPending}
        className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90 sm:w-auto"
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ArrowUpRight className="mr-2 h-4 w-4" />
        )}
        Demander la mise à niveau
      </Button>

      {currentPlan === 'PREMIUM' ? (
        <p className="text-xs text-muted-foreground">
          Vous êtes déjà sur le forfait le plus élevé.
        </p>
      ) : null}
    </div>
  );
}
