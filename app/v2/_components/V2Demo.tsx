'use client';

import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import Reveal from './Reveal';
import DemoAnimation from './DemoAnimation';

// The core flow, shown as short animated demos (mock app + moving cursor).
// Alt text and captions live in the dictionary under landing.demo.<n>.*
const STEPS = [
  { n: '1', src: '/images/demos/restaurant.svg' },
  { n: '2', src: '/images/demos/categories.svg' },
  { n: '3', src: '/images/demos/numerique.svg' }
] as const;

/**
 * "Voyez comment ça marche" — a compact gallery of animated product demos.
 * Each card shows a mock app view with a cursor performing the step, so
 * visitors see the real flow before signing up.
 */
export default function V2Demo() {
  const { t } = useI18n();
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <p className="text-center text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
            {t('landing.demo.eyebrow')}
          </p>
          <h2 className="font-serif-display mx-auto mt-4 max-w-[20ch] text-center text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
            {t('landing.demo.title')}
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-center leading-relaxed text-muted-foreground">
            {t('landing.demo.intro')}
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.src} delay={i * 0.08}>
              <DemoAnimation
                src={s.src}
                alt={t(`landing.demo.${s.n}.alt` as TranslationKey)}
                caption={t(`landing.demo.${s.n}.caption` as TranslationKey)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
