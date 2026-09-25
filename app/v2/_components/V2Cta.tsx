'use client';

import { useI18n } from '@/lib/i18n';
import Reveal from './Reveal';
import V2Button from './V2Button';

/**
 * Closing marquee band. The one place the gold becomes a full surface, so the
 * final call to action lands with weight against the otherwise cream/white
 * page. Off-black text on gold keeps contrast well above AA.
 *
 * Client component so switching locale re-renders it immediately.
 */
export default function V2Cta() {
  const { t } = useI18n();
  return (
    <section className="px-6 py-24 lg:py-32">
      <Reveal>
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-yellow-400 px-8 py-20 text-center sm:px-16">
          <h2 className="font-serif-display mx-auto max-w-[18ch] text-4xl font-light leading-[1.05] tracking-[-0.02em] text-black sm:text-6xl">
            {t('landing.cta.title')}
          </h2>
          <p className="mx-auto mt-5 max-w-[48ch] text-lg leading-relaxed text-black/70">
            {t('landing.cta.body')}
          </p>
          <div className="mt-10 flex items-center justify-center">
            <V2Button
              href="/auth/sign-up"
              variant="dark"
              className="w-full sm:w-auto"
            >
              {t('landing.cta.button')}
            </V2Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
