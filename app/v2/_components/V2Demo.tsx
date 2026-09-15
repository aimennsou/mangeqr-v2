import Reveal from './Reveal';
import DemoAnimation from './DemoAnimation';

// The core flow, shown as short animated demos (mock app + moving cursor).
const STEPS = [
  {
    src: '/images/demos/restaurant.svg',
    alt: 'Créer un restaurant en un clic',
    caption: '1 · Créez votre restaurant'
  },
  {
    src: '/images/demos/categories.svg',
    alt: 'Ajouter une catégorie et un plat',
    caption: '2 · Ajoutez vos plats'
  },
  {
    src: '/images/demos/numerique.svg',
    alt: 'Générer et télécharger le QR code',
    caption: '3 · Générez votre QR code'
  }
];

/**
 * "Voyez comment ça marche" — a compact gallery of animated product demos.
 * Each card shows a mock app view with a cursor performing the step, so
 * visitors see the real flow before signing up.
 */
export default function V2Demo() {
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <p className="text-center text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
            En action
          </p>
          <h2 className="font-serif-display mx-auto mt-4 max-w-[20ch] text-center text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
            Votre carte en ligne, en trois gestes.
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-center leading-relaxed text-muted-foreground">
            Pas de configuration compliquée. Créez, remplissez, partagez — voici
            à quoi ça ressemble.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.src} delay={i * 0.08}>
              <DemoAnimation src={s.src} alt={s.alt} caption={s.caption} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
