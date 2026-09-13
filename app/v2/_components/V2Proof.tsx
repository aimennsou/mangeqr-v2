import Reveal from './Reveal';

/**
 * Bento proof band. A 6-column grid on desktop with one hero tile (the +22%
 * story spans wide) and three supporting tiles, so weights differ and the eye
 * has a focal point. The grid stays mathematically exact with no dead cells.
 */
export default function V2Proof() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
            Ce qui fait la différence
          </p>
          <h2 className="font-serif-display mt-4 max-w-[20ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
            Votre carte est votre meilleur atout marketing.
          </h2>
          <p className="mt-5 max-w-[60ch] leading-relaxed text-muted-foreground">
            Plus de clients vous découvrent sur Google, vous font confiance au
            premier coup d&apos;œil et vous suivent sur les réseaux. Et ils
            reviennent plus souvent.
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
                  Plus de couverts, chaque jour
                </h3>
                <p className="mt-2 max-w-[48ch] leading-relaxed text-muted-foreground">
                  Une carte riche et photographiée sur Google double les chances
                  qu&apos;un passant affamé vous choisisse plutôt que
                  l&apos;établissement d&apos;à côté, avant même de pousser la
                  porte.
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
                  Une réputation renforcée
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Allergènes, prix clairs et photos honnêtes réduisent les
                  frictions qui génèrent les avis une étoile.
                </p>
              </div>
            </article>
          </Reveal>

          {/* Two half-width tiles fill the bottom row exactly */}
          <Reveal className="sm:col-span-3">
            <article className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-8">
              <div className="font-serif-display text-4xl font-light text-foreground">
                Coup de foudre
              </div>
              <div className="mt-6">
                <h3 className="text-base font-semibold text-foreground">
                  Au premier regard
                </h3>
                <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                  Les clients jugent votre cuisine avant la première bouchée.
                  Une carte bien structurée transforme un passant curieux en
                  client enthousiaste.
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
                  D&apos;abonnés chaque mois
                </h3>
                <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                  Votre Instagram et votre TikTok mis en avant sur la carte. Les
                  clients vous suivent pendant qu&apos;ils attendent, et
                  reviennent à chaque offre spéciale.
                </p>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
