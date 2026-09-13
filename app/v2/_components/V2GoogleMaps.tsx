import { Link2 } from 'lucide-react';

import MapMockup from '../../(landing)/_components/ui/MapMockup';
import Reveal from './Reveal';
import V2Button from './V2Button';

/**
 * Google Maps / Business presence. Asymmetric split: copy + a shareable-URL
 * card on the left, the Maps mockup on the right, then a big connect CTA.
 */
export default function V2GoogleMaps() {
  return (
    <section className="border-t border-border px-6 py-24 lg:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: copy + URL card */}
        <div>
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Soyez trouvé. Soyez choisi.
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <h2 className="font-serif-display mt-4 max-w-[16ch] text-4xl font-light leading-[1.1] tracking-[-0.02em] text-foreground sm:text-5xl">
              Affirmez votre présence sur{' '}
              <span className="italic font-medium text-yellow-500">
                Google Maps
              </span>{' '}
              et Business.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[54ch] text-lg font-light leading-relaxed text-muted-foreground">
              MangeQR vous offre un lien de carte clair et partageable que vous
              collez directement dans votre profil Google Business. Le bouton
              « Afficher la carte » sur Maps pointe alors vers une page toujours
              à jour, au lieu d&apos;un PDF cassé ou de rien du tout.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-black">
                <Link2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Votre propre URL directe
                </p>
                <p className="truncate font-mono text-sm text-foreground">
                  monresto
                  <span className="text-yellow-600 dark:text-yellow-500">
                    .mangeqr.com
                  </span>
                  /menu
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right: Google Maps mockup. NOT wrapped in Reveal/FadeUp: the
            all-percentage/absolute-sized mockup collapses inside a
            shrink-wrapping animated container. */}
        <MapMockup />
      </div>

      {/* CTA */}
      <Reveal delay={0.1}>
        <div className="mt-14 flex justify-center">
          <V2Button href="/auth/sign-up">
            Connecter à Google Maps — gratuit
          </V2Button>
        </div>
      </Reveal>
    </section>
  );
}
