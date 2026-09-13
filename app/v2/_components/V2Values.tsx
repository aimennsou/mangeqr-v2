import Reveal from './Reveal';

const VALUES = [
  {
    n: '01',
    title: 'Réduisez vos dépenses',
    body: 'Fini les réimpressions à chaque changement de prix ou de plat. Vous modifiez, la carte se met à jour partout.'
  },
  {
    n: '02',
    title: 'Simplifiez vos modifications',
    body: 'Une carte synchronisée 24h/24, 7j/7. Un plat épuisé, un nouveau menu du jour : quelques clics depuis votre téléphone.'
  },
  {
    n: '03',
    title: 'Modernisez votre établissement',
    body: "Une carte soignée rassure au premier regard, améliore l'expérience client et vous démarque de la table d'à côté."
  }
];

/**
 * Typographic index of the three core value props — deliberately NOT three
 * equal cards. An asymmetric 5/7 split: a quiet section intro on the left, a
 * numbered editorial list with hairline dividers on the right.
 */
export default function V2Values() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-12 lg:gap-16 lg:py-32">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Pourquoi MangeQR
            </p>
            <h2 className="font-serif-display mt-4 max-w-[14ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
              Trois façons d&apos;améliorer votre activité.
            </h2>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <ul>
            {VALUES.map((v, i) => (
              <Reveal key={v.n} delay={i * 0.06}>
                <li className="flex gap-6 border-b border-border py-8 first:pt-0 last:border-b-0">
                  <span className="font-serif-display shrink-0 text-2xl font-light text-yellow-500">
                    {v.n}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {v.title}
                    </h3>
                    <p className="mt-2 max-w-[52ch] leading-relaxed text-muted-foreground">
                      {v.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
