'use client';

import { Plus } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import Reveal from './Reveal';

// Question/answer pairs live in the dictionary as landing.faq.q<n> / .a<n>.
const FAQ_KEYS = ['1', '2', '3', '4'] as const;

/**
 * FAQ as a typographic index using native <details> (accessible, keyboard-ready,
 * no JS, no motion to gate). Hairline dividers, quiet plus marker that rotates
 * on open.
 *
 * Client component so switching locale re-renders it immediately.
 */
export default function V2Faq() {
  const { t } = useI18n();
  return (
    <section className="border-t border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-12 lg:gap-16 lg:py-32">
        <div className="lg:col-span-4">
          <Reveal>
            <h2 className="font-serif-display text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
              {t('landing.faq.title')}
            </h2>
          </Reveal>
        </div>

        <div className="lg:col-span-8">
          {FAQ_KEYS.map((n, i) => (
            <Reveal key={n} delay={i * 0.04}>
              <details className="group border-b border-border py-5 first:border-t">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-foreground marker:hidden">
                  {t(`landing.faq.q${n}` as TranslationKey)}
                  <Plus
                    className="h-5 w-5 shrink-0 text-yellow-500 transition-transform duration-200 group-open:rotate-45"
                    strokeWidth={2}
                  />
                </summary>
                <p className="mt-3 max-w-[62ch] leading-relaxed text-muted-foreground">
                  {t(`landing.faq.a${n}` as TranslationKey)}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
