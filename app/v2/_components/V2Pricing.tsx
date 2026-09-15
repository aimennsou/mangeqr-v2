'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

import { TIERS, PAYMENT_FREQUENCIES } from '@/config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Reveal from './Reveal';

/**
 * Editorial pricing. Not three equal cards: Pro (popular) is emphasized with a
 * gold border and a lift, while Starter and Premium sit quieter alongside it,
 * giving the row a clear focal point. Prices + features come from @/config.
 */
export default function V2Pricing() {
  const [freq, setFreq] = useState<string>(PAYMENT_FREQUENCIES[0]);

  return (
    <section id="tarifs" className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
                Tarifs
              </p>
              <h2 className="font-serif-display mt-4 max-w-[16ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
                Un tarif simple, sans surprise.
              </h2>
            </div>

            {/* Frequency toggle */}
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
                  {f}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          {TIERS.map((tier, i) => {
            const isPopular = !!tier.popular;
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
                        Le plus choisi
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-serif-display text-5xl font-light text-foreground">
                      {tier.price[freq]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{freq === 'annuel' ? 'an' : 'mois'}
                    </span>
                  </div>

                  <p className="mt-4 min-h-[3.5rem] text-sm leading-relaxed text-muted-foreground">
                    {tier.description}
                  </p>

                  <Link href="/pricing" className="mt-6 block">
                    <Button
                      className={cn(
                        'w-full',
                        isPopular
                          ? 'bg-yellow-400 text-black hover:bg-yellow-400/90'
                          : ''
                      )}
                      variant={isPopular ? 'default' : 'outline'}
                    >
                      {tier.cta}
                    </Button>
                  </Link>

                  <ul className="mt-8 space-y-3 border-t border-border pt-6">
                    {tier.features
                      .filter((f) => !f.startsWith('Module gestion de commande'))
                      .slice(0, 7)
                      .map((feat) => (
                        <li key={feat} className="flex gap-3 text-sm">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500"
                            strokeWidth={2.25}
                          />
                          <span className="text-foreground/90">{feat}</span>
                        </li>
                      ))}
                  </ul>

                  {/* Optional add-on: the ordering module, available on every
                      plan for +5€/mois. */}
                  <div className="mt-6 rounded-xl border border-dashed border-yellow-400/60 bg-yellow-400/5 p-3">
                    <p className="text-xs font-semibold text-foreground">
                      + Module gestion de commande sur place + livraison{' '}
                      <span className="text-yellow-600 dark:text-yellow-500">
                        +5€/mois
                      </span>
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Plan de salle, vue cuisine et caisse (POS) avec impression
                      de tickets.
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Tous les plans incluent les scans illimités, la synchronisation
            automatique et l&apos;assistance.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
