'use client';

import { useI18n } from '@/lib/i18n';
import Reveal from './Reveal';

/**
 * Bento proof band. A 6-column grid on desktop with one hero tile (the +22%
 * story spans wide) and three supporting tiles, so weights differ and the eye
 * has a focal point. The grid stays mathematically exact with no dead cells.
 *
 * The numeric metrics (+22%, 4.8★, +18%) are left as literals: they are figures,
 * not copy. Only the third tile's metric is words, so that one is translated.
 */
export default function V2Proof() {
  const { t } = useI18n();
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
            {t('landing.proof.eyebrow')}
          </p>
          <h2 className="font-serif-display mt-4 max-w-[20ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
            {t('landing.proof.title')}
          </h2>
          <p className="mt-5 max-w-[60ch] leading-relaxed text-muted-foreground">
            {t('landing.proof.intro')}
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-6">
          {/* Hero tile — spans 4 cols */}
          <Reveal className="sm:col-span-4">
            <article className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-8">
              <div className="font-serif-display text-6xl font-light text-yellow-500">
                +22%
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-foreground">
                  {t('landing.proof.1.title')}
                </h3>
                <p className="mt-2 max-w-[48ch] leading-relaxed text-muted-foreground">
                  {t('landing.proof.1.body')}
                </p>
              </div>
            </article>
          </Reveal>

          {/* Supporting tile — 2 cols */}
          <Reveal className="sm:col-span-2">
            <article className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-8">
              <div className="font-serif-display text-5xl font-light text-foreground">
                4.8<span className="text-yellow-500">★</span>
              </div>
              <div className="mt-6">
                <h3 className="text-base font-semibold text-foreground">
                  {t('landing.proof.2.title')}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t('landing.proof.2.body')}
                </p>
              </div>
            </article>
          </Reveal>

          {/* Two half-width tiles fill the bottom row exactly */}
          <Reveal className="sm:col-span-3">
            <article className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-8">
              <div className="font-serif-display text-4xl font-light text-foreground">
                {t('landing.proof.3.metric')}
              </div>
              <div className="mt-6">
                <h3 className="text-base font-semibold text-foreground">
                  {t('landing.proof.3.title')}
                </h3>
                <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                  {t('landing.proof.3.body')}
                </p>
              </div>
            </article>
          </Reveal>

          <Reveal className="sm:col-span-3">
            <article className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-8">
              <div className="font-serif-display text-5xl font-light text-yellow-500">
                +18%
              </div>
              <div className="mt-6">
                <h3 className="text-base font-semibold text-foreground">
                  {t('landing.proof.4.title')}
                </h3>
                <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                  {t('landing.proof.4.body')}
                </p>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
