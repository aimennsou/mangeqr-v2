import Link from "next/link";
import { ArrowRight } from "lucide-react";

import PhoneFrame from "../ui/PhoneFrame";
import EditorMockup from "../ui/EditorMockup";
import FadeUp from "../Fadeup";

// Numbered feature points (bold lead + supporting sentence).
const POINTS = [
  {
    lead: "Plusieurs cartes, une seule app.",
    body: "Quotidien, déjeuner hebdomadaire, carte du week-end, dégustations saisonnières — activez-les/désactivez-les d'un simple bouton.",
  },
  {
    lead: "Marquez comme épuisé en un clic.",
    body: "L'article apparaît en grisé pour les clients au lieu de les décevoir à table.",
  },
  {
    lead: "Variantes, suppléments, allergènes.",
    body: "Tous les détails que vos clients demandent réellement, gérés une seule fois.",
  },
  {
    lead: "Votre devise, vos règles.",
    body: "$, €, £, ¥, CHF — quelle que soit la devise de votre facturation.",
  },
];

export default function CardEditor() {
  return (
    <section id="card-editor" className="w-full px-6 py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: phone with the editor mockup */}
        <FadeUp delay={0.2} duration={0.9}>
          <div className="flex justify-center lg:justify-start">
            <PhoneFrame>
              <EditorMockup />
            </PhoneFrame>
          </div>
        </FadeUp>

        {/* Right: copy + numbered list */}
        <div>
          <FadeUp delay={0.1} duration={0.7}>
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-500">
              Éditeur de la carte
            </p>
          </FadeUp>

          <FadeUp delay={0.2} duration={0.8}>
            <h2 className="font-serif-display mt-4 text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl">
              Mettez à jour votre carte depuis votre téléphone. En 10 secondes.
            </h2>
          </FadeUp>

          <FadeUp delay={0.3} duration={0.8}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Gérez autant de cartes que nécessaire — un menu du jour, un
              déjeuner hebdomadaire qui change le lundi, une carte spéciale
              week-end, le brunch, l'happy hour. Activez-les/désactivez-les en
              ligne, réorganisez les catégories, modifiez un prix — le tout
              depuis la poche du tablier du commis.
            </p>
          </FadeUp>

          <div className="mt-8 space-y-5">
            {POINTS.map((p, i) => (
              <FadeUp key={p.lead} delay={0.4 + i * 0.1} duration={0.7}>
                <div className="flex gap-4">
                  <span className="font-serif-display shrink-0 text-lg font-medium text-yellow-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-neutral-900">
                      {p.lead}
                    </span>{" "}
                    {p.body}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <FadeUp delay={0.5} duration={0.8}>
        <div className="mt-14 flex justify-center">
          <Link
            href="/auth/sign-up"
            className="group inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-lg font-bold text-black shadow-lg shadow-yellow-400/30 transition-transform hover:scale-[1.03]"
          >
            Modifier depuis mon téléphone
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </FadeUp>
    </section>
  );
}
