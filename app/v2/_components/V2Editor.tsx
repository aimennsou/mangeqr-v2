import PhoneFrame from '../../(landing)/_components/ui/PhoneFrame';
import EditorMockup from '../../(landing)/_components/ui/EditorMockup';
import Reveal from './Reveal';
import V2Button from './V2Button';

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
  },
  {
    title: 'Votre devise, vos règles.',
    body: '$, €, £, ¥, CHF. Quelle que soit la devise de votre facturation.'
  }
];

/**
 * Asymmetric split (phone left, copy right) — the reverse orientation of the
 * hero so the rhythm changes. The editor mockup sits on the offset side against
 * a soft surface panel.
 */
export default function V2Editor() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 py-24 lg:grid-cols-12 lg:gap-10 lg:py-32">
        {/* Phone — left, 5 cols */}
        <div className="order-2 lg:order-1 lg:col-span-5">
          <Reveal>
            <div className="flex justify-center lg:-translate-x-2">
              <PhoneFrame>
                <EditorMockup />
              </PhoneFrame>
            </div>
          </Reveal>
        </div>

        {/* Copy — right, 7 cols */}
        <div className="order-1 lg:order-2 lg:col-span-7">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Éditeur de la carte
            </p>
            <h2 className="font-serif-display mt-4 max-w-[18ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
              Mettez à jour votre carte depuis votre téléphone. En 10 secondes.
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
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
            <div className="mt-10">
              <V2Button href="/auth/sign-up">
                Modifier depuis mon téléphone
              </V2Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
