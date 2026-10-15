'use client';

import { Star, ThumbsUp, ShieldCheck, MessageSquare, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import Reveal from './Reveal';
import V2Button from './V2Button';

// Copy lives in the dictionary under landing.reputation.<n>.title / .desc
const POINTS: { icon: LucideIcon; n: string }[] = [
  { icon: ThumbsUp, n: '1' },
  { icon: ShieldCheck, n: '2' },
  { icon: MessageSquare, n: '3' },
];

/**
 * "Gérez votre réputation" — a big, visual section built around the review flow
 * MangeQR already ships (positive → Google, negative → captured privately),
 * with a mock review card on one side and the value points on the other.
 */
export default function V2Reputation() {
  const { t } = useI18n();
  return (
    <section className="border-t border-border">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-16 lg:py-32">
        {/* Left: copy + points */}
        <div>
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              {t('landing.reputation.eyebrow')}
            </p>
            <h2 className="font-serif-display mt-4 max-w-[18ch] text-4xl font-light leading-[1.1] tracking-[-0.02em] text-foreground sm:text-5xl">
              {t('landing.reputation.title')}
            </h2>
            <p className="mt-6 max-w-[54ch] text-lg font-light leading-relaxed text-muted-foreground">
              {t('landing.reputation.intro')}
            </p>
          </Reveal>

          <div className="mt-8 space-y-3">
            {POINTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.n} delay={0.1 + i * 0.06}>
                  <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {t(`landing.reputation.${p.n}.title` as TranslationKey)}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {t(`landing.reputation.${p.n}.desc` as TranslationKey)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.15}>
            <div className="mt-8">
              <V2Button href="/auth/sign-up">
                {t('landing.reputation.cta')}
              </V2Button>
            </div>
          </Reveal>
        </div>

        {/* Right: mock review card */}
        <Reveal delay={0.1}>
          <div className="relative mx-auto w-full max-w-md">
            {/* Soft gold wash behind the card */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-yellow-400/15 blur-2xl"
            />
            <div className="relative rounded-3xl border border-border bg-background p-6 shadow-xl">
              <p className="text-lg font-semibold text-foreground">
                {t('landing.reputation.card.title')}
              </p>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      'h-9 w-9',
                      n <= 5 ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
                    )}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {t('landing.reputation.card.thanks')}
              </p>
              <div className="mt-4 rounded-xl bg-yellow-400 px-4 py-3 text-center text-sm font-semibold text-black">
                {t('landing.reputation.card.button')}
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('landing.reputation.card.avgLabel')}
                  </span>
                  <span className="font-serif-display text-2xl font-light text-foreground">
                    4.8<span className="text-yellow-500">★</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
