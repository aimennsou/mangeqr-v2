'use client';

import PhoneFrame from '@/components/mockups/PhoneFrame';
import LiveMenu from '@/components/mockups/LiveMenu';
import { useI18n } from '@/lib/i18n';
import Reveal from './Reveal';
import V2Button from './V2Button';

// Dictionary key suffixes for the three hero stats (values + labels both live in
// the dictionary: "2 pays" / "2 countries" / "بلدان" all differ).
const STAT_KEYS = ['stat1', 'stat2', 'stat3'] as const;

/**
 * Editorial full-bleed hero. Asymmetric 7/5 grid: a short, wide serif headline
 * and the live phone mockup sitting slightly off the right edge for tension.
 */
export default function V2Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden">
      {/* Single restrained gold wash behind the phone (one effect, used once).
          `-end-40` is the logical equivalent of `-right-40`, so the wash follows
          the phone to the left under dir="rtl" instead of staying pinned to the
          right of the copy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-40 top-24 h-[520px] w-[520px] rounded-full bg-yellow-400/20 blur-[120px]"
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-24 pt-32 lg:grid-cols-12 lg:gap-8 lg:pt-40">
        {/* Copy — 7 columns */}
        <div className="lg:col-span-7">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              {t('landing.hero.badge')}
            </span>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="font-serif-display mt-6 max-w-[16ch] text-5xl font-light leading-[1.02] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-7xl">
              {t('landing.hero.titleLead')}{' '}
              <span className="italic font-medium text-yellow-500">
                {t('landing.hero.titleAccent')}
              </span>
              .
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[60ch] text-lg font-light leading-relaxed text-muted-foreground">
              {t('landing.hero.bodyLead')}{' '}
              <span className="font-medium text-foreground">
                {t('landing.hero.bodyAccent')}
              </span>
              {t('landing.hero.bodyRest')}
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <V2Button href="/go/fr" className="w-full sm:w-auto">
                {t('landing.hero.cta')}
              </V2Button>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <dl className="mt-14 flex flex-wrap gap-x-12 gap-y-6 border-t border-border pt-8">
              {STAT_KEYS.map((k) => (
                <div key={k}>
                  <dt className="font-serif-display text-3xl font-medium tabular-nums text-foreground">
                    {t(`landing.hero.${k}Value`)}
                  </dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {t(`landing.hero.${k}Label`)}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* Phone — 5 columns, offset for edge tension */}
        <div className="relative lg:col-span-5">
          <Reveal delay={0.1}>
            {/* CSS transforms are physical, not logical, so the offset that
                pushes the phone toward the right edge in LTR has to be mirrored
                explicitly for RTL to keep the same edge tension. */}
            <div className="flex justify-center lg:translate-x-6 lg:rtl:-translate-x-6">
              <PhoneFrame>
                <LiveMenu />
              </PhoneFrame>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
