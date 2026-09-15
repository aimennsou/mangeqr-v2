import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FadeUp from "../Fadeup";

// Stat cards — each: metric (with optional accent glyph), small label, title, body.
const CARDS = [
  {
    metric: "+22%",
    label: "Trafic piéton moyen",
    title: "Plus de couverts, chaque jour",
    body: "Une carte riche et photographiée sur Google double les chances qu'un passant affamé vous choisisse plutôt que l'établissement d'à côté — avant même de pousser la porte.",
  },
  {
    metric: "4.8",
    accent: "★",
    label: "Hausse moyenne de la note",
    title: "Une réputation en ligne renforcée",
    body: "Allergènes, prix clairs et photos honnêtes réduisent les frictions — et les frictions sont ce qui génère les avis 1 étoile.",
  },
  {
    metric: "·01",
    label: "Impression client",
    title: "Coup de foudre au premier regard",
    body: "Les clients jugent votre cuisine avant la première bouchée. Une carte magnifique et bien structurée est un gage de qualité — et transforme un passant curieux en un client confiant et enthousiaste.",
  },
  {
    metric: "+18%",
    label: "Plus d'abonnés / mois",
    title: "Transformez chaque visite en un follower",
    body: "MangeQR met en avant votre Instagram, TikTok et vos réseaux sociaux sur votre carte. Les clients vous suivent pendant qu'ils attendent — et reviennent chaque fois que vous publiez une offre spéciale.",
  },
];

export default function MarketingTool() {
  return (
    <section id="marketing-tool" className="w-full px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Heading block */}
        <div className="max-w-2xl">
          <FadeUp delay={0.1} duration={0.7}>
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-500">
              Ce qui fait toute la différence
            </p>
          </FadeUp>

          <FadeUp delay={0.2} duration={0.8}>
            <h2 className="font-serif-display mt-4 text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl">
              Transformez votre carte en un{" "}
              <span className="italic font-medium text-yellow-500">
                outil marketing
              </span>
              .
            </h2>
          </FadeUp>

          <FadeUp delay={0.3} duration={0.8}>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Votre carte est votre meilleur atout marketing. Plus de clients
              vous découvrent sur Google, vous font confiance au premier coup
              d'œil, vous suivent sur les réseaux sociaux — et reviennent plus
              souvent dans votre établissement.
            </p>
          </FadeUp>
        </div>

        {/* Stat cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c, i) => (
            <FadeUp key={c.title} delay={0.35 + i * 0.1} duration={0.7}>
              <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-3xl font-semibold text-yellow-500">
                  {c.metric}
                  {c.accent ? <span className="ml-0.5">{c.accent}</span> : null}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </p>
                <h3 className="mt-4 font-bold text-neutral-900">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* CTA */}
        <FadeUp delay={0.5} duration={0.8}>
          <div className="mt-14 flex justify-center">
            <Link
              href="/auth/sign-up"
              className="group inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-lg font-bold text-black shadow-lg shadow-yellow-400/30 transition-transform hover:scale-[1.03]"
            >
              Créez votre première carte
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
