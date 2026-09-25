'use client';

import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import Reveal from './Reveal';

// Numbered index; copy lives in the dictionary under landing.values.<n>.*
const VALUES = ['1', '2', '3'] as const;

/**
 * Typographic index of the three core value props — deliberately NOT three
 * equal cards. An asymmetric 5/7 split: a quiet section intro on the left, a
 * numbered editorial list with hairline dividers on the right.
 *
 * Client component so switching locale re-renders it immediately (the provider
 * holds the locale in React state; a server component would keep serving the
 * language from the cookie until a full reload).
 */
export default function V2Values() {
  const { t } = useI18n();
  return (
    <section className="border-t border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-12 lg:gap-16 lg:py-32">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              {t('landing.values.eyebrow')}
            </p>
            <h2 className="font-serif-display mt-4 max-w-[14ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
              {t('landing.values.title')}
            </h2>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <ul>
            {VALUES.map((n, i) => (
              <Reveal key={n} delay={i * 0.06}>
                <li className="flex gap-6 border-b border-border py-8 first:pt-0 last:border-b-0">
                  <span className="font-serif-display shrink-0 text-2xl font-light text-yellow-500">
                    {`0${n}`}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {t(`landing.values.${n}.title` as TranslationKey)}
                    </h3>
                    <p className="mt-2 max-w-[52ch] leading-relaxed text-muted-foreground">
                      {t(`landing.values.${n}.body` as TranslationKey)}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
