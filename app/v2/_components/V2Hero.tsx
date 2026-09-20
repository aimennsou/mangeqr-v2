'use client';

import PhoneFrame from '../../(landing)/_components/ui/PhoneFrame';
import LiveMenu from '../../(landing)/_components/ui/LiveMenu';
import Reveal from './Reveal';
import V2Button from './V2Button';

const STATS = [
  { value: '+22%', label: 'de clients fidélisés' },
  { value: '10 s', label: 'pour mettre à jour' },
  { value: '2 400+', label: 'restaurants' }
];

/**
 * Editorial full-bleed hero. Asymmetric 7/5 grid: a short, wide serif headline
 * and the live phone mockup sitting slightly off the right edge for tension.
 */
export default function V2Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Single restrained gold wash behind the phone (one effect, used once). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-24 h-[520px] w-[520px] rounded-full bg-yellow-400/20 blur-[120px]"
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-24 pt-32 lg:grid-cols-12 lg:gap-8 lg:pt-40">
        {/* Copy — 7 columns */}
        <div className="lg:col-span-7">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              Menu numérique par code QR
            </span>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="font-serif-display mt-6 max-w-[16ch] text-5xl font-light leading-[1.02] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-7xl">
              Votre carte, prête en{' '}
              <span className="italic font-medium text-yellow-500">
                deux minutes
              </span>
              .
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[60ch] text-lg font-light leading-relaxed text-muted-foreground">
              Créez des menus{' '}
              <span className="font-medium text-foreground">
                numériques et physiques
              </span>
              , collectez des avis clients et lancez vos campagnes marketing.
              Une carte toujours à jour, sans jamais réimprimer.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <V2Button href="/go/fr" className="w-full sm:w-auto">
                Créer ma carte
              </V2Button>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <dl className="mt-14 flex flex-wrap gap-x-12 gap-y-6 border-t border-border pt-8">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="font-serif-display text-3xl font-medium tabular-nums text-foreground">
                    {s.value}
                  </dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* Phone — 5 columns, offset for edge tension */}
        <div className="relative lg:col-span-5">
          <Reveal delay={0.1}>
            <div className="flex justify-center lg:translate-x-6">
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
