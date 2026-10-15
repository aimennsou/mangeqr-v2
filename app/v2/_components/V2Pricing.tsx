'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

import {
  TIERS,
  PAYMENT_FREQUENCIES,
  REGION_PRICING,
  REGION_LABELS,
  defaultPricingRegion,
  getRegionTierPrice,
  PRICING_ADDON_FEATURE,
  PRICING_PER_TABLE_FEATURE,
  type PricingRegion,
} from '@/config';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import Reveal from './Reveal';
import V2DevisDialog from './V2DevisDialog';

/** How many feature bullets fit on a card before it gets too tall. */
const MAX_VISIBLE_FEATURES = 7;

/**
 * Editorial pricing. Not three equal cards: Pro (popular) is emphasized with a
 * gold border and a lift, while Starter and Premium sit quieter alongside it,
 * giving the row a clear focal point. Prices come from @/config; all copy comes
 * from the dictionary via the tiers' `descriptionKey` / `featureKeys`.
 */
export default function V2Pricing() {
  const { t, locale } = useI18n();
  const [freq, setFreq] = useState<string>(PAYMENT_FREQUENCIES[0]);
  /** Tier whose "Contactez-nous" was clicked; drives the contact dialog. */
  const [contactPlan, setContactPlan] = useState<string | null>(null);
  /**
   * Region is DERIVED from the locale until the visitor picks one explicitly.
   *
   * It used to be plain `useState('france')`, so an Arabic visitor — i.e. the
   * Algerian market — landed on euro prices. Storing only the override (rather
   * than seeding state from the locale) means the default keeps following a
   * language switch, while an explicit choice sticks for the rest of the visit.
   */
  const [regionOverride, setRegionOverride] = useState<PricingRegion | null>(
    null
  );
  const region = regionOverride ?? defaultPricingRegion(locale);
  const pricing = REGION_PRICING[region];

  const isAnnual = freq === 'annuel';

  return (
    <section id="tarifs" className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
                {t('landing.pricing.eyebrow')}
              </p>
              <h2 className="font-serif-display mt-4 max-w-[16ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
                {t('landing.pricing.title')}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Region selector — switches prices between France (€) and
                  Algérie (DZD). Region NAMES are places, not copy. */}
              <Select
                value={region}
                onValueChange={(v) => setRegionOverride(v as PricingRegion)}
              >
                <SelectTrigger
                  className="w-[130px]"
                  aria-label={t('landing.pricing.region')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REGION_LABELS) as PricingRegion[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {REGION_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Frequency toggle. The VALUE stays 'mensuel'/'annuel' because it
                  keys into the price tables; only the label is translated. */}
              <div className="inline-flex rounded-lg border border-border bg-background p-1">
                {PAYMENT_FREQUENCIES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFreq(f)}
                    className={cn(
                      'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                      freq === f
                        ? 'bg-yellow-400 text-black'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t(
                      f === 'annuel'
                        ? 'landing.pricing.yearly'
                        : 'landing.pricing.monthly'
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          {TIERS.map((tier, i) => {
            const isPopular = !!tier.popular;

            // The ordering module has its own highlighted block below, so it is
            // never rendered as a plain bullet.
            const bullets = tier.featureKeys
              .filter((k) => k !== PRICING_ADDON_FEATURE)
              .slice(0, MAX_VISIBLE_FEATURES);

            return (
              <Reveal key={tier.id} delay={i * 0.06} className="flex">
                <article
                  className={cn(
                    'flex w-full flex-col rounded-2xl border p-8',
                    isPopular
                      ? 'border-yellow-400 bg-background shadow-lg lg:-my-2 lg:py-10'
                      : 'border-border bg-background'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {tier.title}
                    </h3>
                    {isPopular ? (
                      <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-black">
                        {t('landing.pricing.popular')}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-serif-display text-5xl font-light text-foreground">
                      {getRegionTierPrice(region, tier.id, freq)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /
                      {t(
                        isAnnual
                          ? 'landing.pricing.perYear'
                          : 'landing.pricing.perMonth'
                      )}
                    </span>
                  </div>

                  {/* Annual + ordering-module bundle price (region-specific). */}
                  {isAnnual && pricing.tiersAnnualWithModule?.[tier.id] ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {pricing.tiersAnnualWithModule[tier.id]}{' '}
                      {t('landing.pricing.annualWithModule')}
                    </p>
                  ) : null}

                  <p className="mt-4 min-h-[3.5rem] text-sm leading-relaxed text-muted-foreground">
                    {t(tier.descriptionKey as TranslationKey)}
                  </p>

                  {/* Opens the contact dialog rather than linking to sign-up.
                      "Contactez-nous" that silently dropped you on a
                      registration form reached nobody. */}
                  <Button
                    onClick={() => setContactPlan(tier.title)}
                    className={cn(
                      'mt-6 w-full',
                      isPopular
                        ? 'bg-yellow-400 text-black hover:bg-yellow-400/90'
                        : ''
                    )}
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    {t('landing.tier.cta')}
                  </Button>

                  <ul className="mt-8 space-y-3 border-t border-border pt-6">
                    {bullets.map((key) => (
                      <li key={key} className="flex gap-3 text-sm">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500"
                          strokeWidth={2.25}
                        />
                        <span className="text-foreground/90">
                          {/* The per-table line is prefixed with the region's
                              surcharge instead of splicing a price out of a
                              translated sentence. */}
                          {key === PRICING_PER_TABLE_FEATURE ? (
                            <>
                              {pricing.perTableDelivery}{' '}
                              {t(`landing.feature.${key}` as TranslationKey)}
                            </>
                          ) : (
                            t(`landing.feature.${key}` as TranslationKey)
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Optional add-on: the ordering module, available on every
                      plan for the region's monthly price. */}
                  <div className="mt-6 rounded-xl border border-dashed border-yellow-400/60 bg-yellow-400/5 p-3">
                    <p className="text-xs font-semibold text-foreground">
                      {t('landing.pricing.addonTitle')}{' '}
                      <span className="text-yellow-600 dark:text-yellow-500">
                        {pricing.orderingAddon}
                      </span>
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t('landing.pricing.addonBody')}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t('landing.pricing.footnote')}
            {pricing.qrDesignFrom ? (
              <>
                {' '}
                {t('landing.pricing.qrDesignNote')} {pricing.qrDesignFrom}.
              </>
            ) : null}
          </p>
        </Reveal>
      </div>

      {/* One controlled dialog for the whole section, keyed on the plan so the
          form resets between tiers. `hideTrigger` because the cards' own buttons
          open it. */}
      {contactPlan ? (
        <V2DevisDialog
          key={contactPlan}
          plan={contactPlan}
          open
          hideTrigger
          onOpenChange={(next) => {
            if (!next) setContactPlan(null);
          }}
        />
      ) : null}
    </section>
  );
}
