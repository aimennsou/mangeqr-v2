'use client';

import { ArrowRight } from 'lucide-react';
import { FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';

import PhoneFrame from '@/components/mockups/PhoneFrame';
import LiveMenu from '@/components/mockups/LiveMenu';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import Reveal from './Reveal';
import V2Button from './V2Button';

// Channels where the restaurateur drops their shareable menu link. The sample
// URL is the same on every row and is sample DATA, so it stays untranslated.
const SAMPLE_URL = 'monresto.mangeqr.com';

const CHANNELS = [
  {
    n: '1',
    icon: FaInstagram,
    tile: 'bg-gradient-to-br from-fuchsia-500 via-red-500 to-yellow-400 text-white'
  },
  { n: '2', icon: FaTiktok, tile: 'bg-black text-white' },
  { n: '3', icon: FaWhatsapp, tile: 'bg-green-500 text-white' }
] as const;

/**
 * Link-in-bio section. Asymmetric split: editorial copy + branded channel rows
 * on the left, the live phone on the right, then a big shareable-link CTA.
 */
export default function V2Reach() {
  const { t } = useI18n();
  return (
    <section className="border-t border-border px-6 py-24 lg:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: copy + channel cards */}
        <div>
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              {t('landing.reach.eyebrow')}
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="font-serif-display mt-4 max-w-[18ch] text-4xl font-light leading-[1.1] tracking-[-0.02em] text-foreground sm:text-5xl">
              {t('landing.reach.title')}
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[54ch] text-lg font-light leading-relaxed text-muted-foreground">
              {t('landing.reach.body')}
            </p>
          </Reveal>

          <div className="mt-8 space-y-3">
            {CHANNELS.map((c, i) => {
              const Icon = c.icon;
              return (
                <Reveal key={c.n} delay={0.15 + i * 0.06}>
                  <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-yellow-400">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${c.tile}`}
                    >
                      <Icon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {t(`landing.reach.${c.n}.title` as TranslationKey)}
                      </p>
                      <p
                        dir="ltr"
                        className="truncate font-mono text-sm text-muted-foreground"
                      >
                        {SAMPLE_URL}
                      </p>
                    </div>
                    {/* Physical arrow: mirrored under RTL so it points along the
                        reading direction. */}
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Right: phone with the live menu */}
        <Reveal delay={0.1}>
          <div className="flex justify-center lg:justify-end">
            <PhoneFrame>
              <LiveMenu />
            </PhoneFrame>
          </div>
        </Reveal>
      </div>

      {/* CTA */}
      <Reveal delay={0.1}>
        <div className="mt-14 flex justify-center">
          <V2Button href="/auth/sign-up">{t('landing.reach.cta')}</V2Button>
        </div>
      </Reveal>
    </section>
  );
}
