import { CreditCard, Banknote, Wallet, Gift } from "lucide-react";
import type { Plan, PlanPaymentMethod } from "@prisma/client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getPlanLimits } from "@/lib/plan";
import { isStripeEnabled } from "@/lib/stripe";
import { MARKETING_ENABLED } from "@/config";
import BillingActions from "./billing-actions";

// Libellés FR pour les plans.
const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Gratuit (essai)",
  STARTER: "Starter",
  PRO: "Pro",
  PREMIUM: "Premium"
};

// Libellés FR courts pour le mode de paiement (badge « glanceable »).
const PAYMENT_METHOD_LABELS: Record<PlanPaymentMethod, string> = {
  CASH: "Espèces",
  ONLINE: "En ligne"
};

// Formateur de date en français (ex. « 12 janvier 2025 »).
const frDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

interface PlanCardProps {
  /** Plan souscrit/acheté par l'utilisateur (peut être expiré). */
  subscribedPlan: Plan;
  /** Plan effectif : Starter si l'abonnement payant est expiré. */
  effectivePlan: Plan;
  /** Date d'échéance/renouvellement (null pour Starter ou non défini). */
  planRenewsAt: Date | null;
  /** Nombre de restaurants de l'utilisateur. */
  restaurantCount: number;
  /** Nombre de menus de l'utilisateur. */
  menuCount: number;
  /** Nombre de campagnes marketing de l'utilisateur. */
  campaignCount: number;
  /** Mode de paiement du plan (espèces/hors ligne ou en ligne). */
  planPaymentMethod: PlanPaymentMethod;
  /** #2: account is Algerian (DZD) → cash upgrade-request flow instead of Stripe. */
  isAlgerian?: boolean;
}

interface UsageRowProps {
  label: string;
  count: number;
  limit: number;
}

function UsageRow({ label, count, limit }: UsageRowProps) {
  const isUnlimited = !Number.isFinite(limit);
  // Garde contre la division par zéro et l'infini (évite NaN).
  const percent =
    Number.isFinite(limit) && limit > 0
      ? Math.min(100, Math.round((count / limit) * 100))
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {isUnlimited ? `${count} / Illimité` : `${count} / ${limit}`}
        </span>
      </div>
      {/* Barre de progression (fallback Tailwind : pas de composant shadcn Progress). */}
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded bg-muted">
        <div
          className="h-full rounded bg-primary transition-all"
          style={{ width: isUnlimited ? "100%" : `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Carte d'abonnement (B.2) : type de plan, statut actif/expiré,
 * date d'expiration et usage vs. limites.
 *
 * Composant présentationnel (serveur) : reçoit les compteurs déjà calculés.
 */
export default function PlanCard({
  subscribedPlan,
  effectivePlan,
  planRenewsAt,
  restaurantCount,
  menuCount,
  campaignCount,
  planPaymentMethod,
  isAlgerian = false
}: PlanCardProps) {
  // FREE is a time-limited trial; paid plans expire on their échéance. STARTER
  // is the legacy non-expiring entry tier.
  const expired =
    subscribedPlan !== "STARTER" &&
    planRenewsAt !== null &&
    planRenewsAt.getTime() < Date.now();

  // Starter n'a pas d'échéance ; les autres plans (FREE inclus) en ont une.
  const hasExpiry = subscribedPlan !== "STARTER" && planRenewsAt !== null;

  // FREE (essai) et STARTER : pas de paiement en ligne / espèces requis.
  const isTrial = subscribedPlan === "FREE";
  const isFreePlan = subscribedPlan === "STARTER" || isTrial;

  // Les limites appliquées correspondent au plan EFFECTIF (cohérent avec le gating).
  const limits = getPlanLimits(effectivePlan);

  return (
    <Card className="rounded-xl border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
            <CreditCard className="h-5 w-5" />
          </span>
          <h3 className="text-lg md:text-xl font-semibold">Mon abonnement</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type de plan + statut */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Plan souscrit</p>
            <p className="font-serif-display text-3xl font-medium tracking-tight text-foreground">{PLAN_LABELS[subscribedPlan]}</p>
            {expired ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Accès limité au plan Starter
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge
              variant={expired ? "destructive" : "default"}
              className="text-sm"
            >
              {expired ? "Expiré" : "Actif"}
            </Badge>
            {/* Mode de paiement « glanceable » (sauf plan gratuit) */}
            {!isFreePlan ? (
              <Badge variant="secondary" className="gap-1 text-xs">
                {planPaymentMethod === "CASH" ? (
                  <Banknote className="h-3.5 w-3.5" />
                ) : (
                  <Wallet className="h-3.5 w-3.5" />
                )}
                {PAYMENT_METHOD_LABELS[planPaymentMethod]}
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Date d'expiration (uniquement pour les plans payants avec échéance) */}
        {hasExpiry && planRenewsAt ? (
          <p className="text-sm text-muted-foreground">
            {expired ? "Expiré le " : "Expire le "}
            <span className="font-medium text-foreground">
              {frDate.format(planRenewsAt)}
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Sans expiration</p>
        )}

        {/* Mode de paiement (C.2) : note hors ligne pour les plans payants en
            espèces, note neutre en ligne, ou mention « gratuit » pour Starter.
            Affichage seul — aucun bouton de paiement (Stripe hors périmètre). */}
        {isTrial ? (
          <Alert variant={expired ? "destructive" : undefined}>
            <Gift className="h-4 w-4" />
            <AlertTitle>
              {expired ? "Essai gratuit terminé" : "Essai gratuit"}
            </AlertTitle>
            <AlertDescription className="text-muted-foreground">
              {expired
                ? "Votre période d'essai est terminée. Passez à un forfait payant pour continuer."
                : "Vous êtes en période d'essai gratuite. Passez à un forfait payant avant l'échéance pour ne pas perdre l'accès."}
            </AlertDescription>
          </Alert>
        ) : isFreePlan ? (
          <Alert>
            <Gift className="h-4 w-4" />
            <AlertTitle>Plan gratuit</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Aucun paiement requis.
            </AlertDescription>
          </Alert>
        ) : planPaymentMethod === "CASH" ? (
          <Alert>
            <Banknote className="h-4 w-4" />
            <AlertTitle>Paiement en espèces</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Votre abonnement est réglé hors ligne (paiement en espèces). Pour
              modifier ou renouveler votre plan, contactez MangeQR.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertTitle>Paiement en ligne</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Votre abonnement est géré en ligne. Pour modifier ou renouveler
              votre plan, contactez MangeQR.
            </AlertDescription>
          </Alert>
        )}

        {/* Usage vs. limites (selon le plan effectif) */}
        <div className="space-y-3 pt-1">
          <p className="text-sm font-semibold">Utilisation</p>
          <UsageRow
            label="Restaurants"
            count={restaurantCount}
            limit={limits.restaurants}
          />
          <UsageRow label="Menus" count={menuCount} limit={limits.menus} />
          {/* Marketing campaigns are not shipped yet (MARKETING_ENABLED). Hide
              the usage row until the feature is live. */}
          {MARKETING_ENABLED ? (
            <UsageRow
              label="Campagnes"
              count={campaignCount}
              limit={limits.campaigns}
            />
          ) : null}
        </div>

        {/* Online subscription controls (Stripe). Hidden when Stripe isn't
            configured — the cash/contact note above still applies. */}
        <BillingActions
          stripeEnabled={isStripeEnabled()}
          isPaidOnline={!isFreePlan && planPaymentMethod === "ONLINE"}
          isAlgerian={isAlgerian}
          paymentMethod={planPaymentMethod}
          currentPlan={effectivePlan}
        />
      </CardContent>
    </Card>
  );
}
