import Reveal from './Reveal';
import V2Button from './V2Button';
import V2LiveEditorDemo from './V2LiveEditorDemo';

const POINTS = [
  {
    title: 'Plusieurs cartes, une seule app.',
    body: "Quotidien, déjeuner de la semaine, carte du week-end, dégustations saisonnières. Activez-les d'un simple bouton."
  },
  {
    title: 'Marquez comme épuisé en un clic.',
    body: "L'article apparaît en grisé pour les clients au lieu de les décevoir à table."
  },
  {
    title: 'Variantes, suppléments, allergènes.',
    body: 'Tous les détails que vos clients demandent vraiment, gérés une seule fois.'
  }
];

/**
 * "Éditeur de la carte" — the copy sits above an interactive concept: an editor
 * panel wired to a live customer preview (V2LiveEditorDemo). Visitors can flip a
 * dish to "épuisé", nudge a price, or take the card offline and watch the diner
 * view update instantly, feeling how modifiable the menu is.
 */
export default function V2Editor() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        {/* Intro copy */}
        <div className="max-w-3xl">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Éditeur de la carte
            </p>
            <h2 className="font-serif-display mt-4 max-w-[20ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
              Modifiez, le client voit. En direct.
            </h2>
            <p className="mt-5 max-w-[52ch] leading-relaxed text-muted-foreground">
              Essayez : baissez un prix, marquez un plat « épuisé » ou mettez la
              carte hors ligne. L&apos;aperçu client à droite se met à jour
              instantanément.
            </p>
          </Reveal>
        </div>

        {/* Interactive editor ↔ preview concept */}
        <Reveal delay={0.05}>
          <div className="mt-12">
            <V2LiveEditorDemo />
          </div>
        </Reveal>

        {/* Supporting points */}
        <div className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {POINTS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05}>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-12">
            <V2Button href="/auth/sign-up">
              Modifier depuis mon téléphone
            </V2Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
