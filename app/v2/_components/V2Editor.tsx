'use client';

import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import Reveal from './Reveal';
import V2Button from './V2Button';
import V2LiveEditorDemo from './V2LiveEditorDemo';

const POINTS = ['1', '2', '3'] as const;

/**
 * "Éditeur de la carte" — the copy sits above an interactive concept: an editor
 * panel wired to a live customer preview (V2LiveEditorDemo). Visitors can flip a
 * dish to "épuisé", nudge a price, or take the card offline and watch the diner
 * view update instantly, feeling how modifiable the menu is.
 */
export default function V2Editor() {
  const { t } = useI18n();
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        {/* Intro copy */}
        <div className="max-w-3xl">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              {t('landing.editor.eyebrow')}
            </p>
            <h2 className="font-serif-display mt-4 max-w-[20ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
              {t('landing.editor.title')}
            </h2>
            <p className="mt-5 max-w-[52ch] leading-relaxed text-muted-foreground">
              {t('landing.editor.intro')}
            </p>
          </Reveal>
        </div>

        {/* Interactive editor ↔ preview concept */}
        <Reveal delay={0.05}>
          <div className="mt-12">
            <V2LiveEditorDemo />
          </div>
        </Reveal>

        {/* Supporting points */}
        <div className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {POINTS.map((n, i) => (
            <Reveal key={n} delay={i * 0.05}>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {t(`landing.editor.${n}.title` as TranslationKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`landing.editor.${n}.body` as TranslationKey)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-12">
            <V2Button href="/auth/sign-up">{t('landing.editor.cta')}</V2Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
