import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";

import MapMockup from "../ui/MapMockup";
import FadeUp from "../Fadeup";

export default function GooglePresence() {
  return (
    <section id="google-presence" className="w-full px-6 py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: copy + URL card */}
        <div>
          <FadeUp delay={0.1} duration={0.7}>
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-500">
              Soyez trouvé. Soyez choisi.
            </p>
          </FadeUp>

          <FadeUp delay={0.2} duration={0.8}>
            <h2 className="font-serif-display mt-4 text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl">
              Affirmez votre présence sur{" "}
              <span className="italic font-medium text-yellow-500">
                Google Maps
              </span>{" "}
              et Business.
            </h2>
          </FadeUp>

          <FadeUp delay={0.3} duration={0.8}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              MangeQR vous offre un lien de carte clair et partageable que vous
              pouvez coller directement dans votre profil Google Business. Le
              bouton « Afficher la carte » sur Maps pointe alors vers une page
              magnifique, toujours à jour — au lieu d'un PDF cassé ou de rien du
              tout.
            </p>
          </FadeUp>

          <FadeUp delay={0.4} duration={0.8}>
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-black">
                <Link2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Votre propre URL directe
                </p>
                <p className="truncate font-mono text-sm text-neutral-900">
                  monresto<span className="text-yellow-600">.mangeqr.com</span>/menu
                </p>
              </div>
            </div>
          </FadeUp>
        </div>

        {/* Right: Google Maps mockup.
            NOT wrapped in FadeUp: FadeUp's `mx-auto` block shrink-wraps, which
            collapsed this all-percentage/absolute-sized mockup to ~2px. */}
        <MapMockup />
      </div>

      {/* CTA */}
      <FadeUp delay={0.5} duration={0.8}>
        <div className="mt-14 flex justify-center">
          <Link
            href="/auth/sign-up"
            className="group inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-lg font-bold text-black shadow-lg shadow-yellow-400/30 transition-transform hover:scale-[1.03]"
          >
            Connecter à Google Maps — gratuit
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </FadeUp>
    </section>
  );
}
