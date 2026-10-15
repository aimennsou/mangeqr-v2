'use client';

import {
  Angry,
  Award,
  BatteryCharging,
  EyeOff,
  Gauge,
  PhoneOff,
  Wand2,
  type LucideIcon
} from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import Reveal from './Reveal';

// Copy lives in the dictionary under landing.features.<n>.title / .body
const FEATURES: { icon: LucideIcon; n: string }[] = [
  { icon: Wand2, n: '1' },
  { icon: BatteryCharging, n: '2' },
  { icon: EyeOff, n: '3' },
  { icon: PhoneOff, n: '4' },
  { icon: Angry, n: '5' },
  { icon: Award, n: '6' },
  { icon: Gauge, n: '7' }
];

/**
 * Dense typographic feature index. A two-column list with hairline row dividers
 * (not a grid of equal cards): quiet lucide icons in the brand gold, tight
 * vertical rhythm, wide measure held in check.
 */
export default function V2Features() {
  const { t } = useI18n();
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <h2 className="font-serif-display max-w-[22ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
            {t('landing.features.title')}
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-16 md:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.n} delay={(i % 2) * 0.05}>
                <div className="flex gap-4 border-t border-border py-6">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {t(`landing.features.${f.n}.title` as TranslationKey)}
                    </h3>
                    <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                      {t(`landing.features.${f.n}.body` as TranslationKey)}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
