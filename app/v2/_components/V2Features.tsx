import {
  Angry,
  Award,
  BatteryCharging,
  EyeOff,
  Gauge,
  MessageSquare,
  PhoneOff,
  Send,
  Wand2,
  type LucideIcon
} from 'lucide-react';

import Reveal from './Reveal';

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Wand2,
    title: 'Personnalisez votre menu',
    body: 'Créez une carte qui vous ressemble grâce à des options de personnalisation avancées.'
  },
  {
    icon: Send,
    title: 'Lancez des campagnes',
    body: 'Créez et envoyez des campagnes marketing ciblées pour atteindre vos clients.'
  },
  {
    icon: BatteryCharging,
    title: 'Des outils qui font gagner du temps',
    body: 'Limitez les modifications répétitives avec des outils pensés pour aller vite.'
  },
  {
    icon: EyeOff,
    title: 'Masquez les plats indisponibles',
    body: 'Cachez les plats en rupture pour garder une carte toujours juste.'
  },
  {
    icon: PhoneOff,
    title: 'Des menus prêts à imprimer',
    body: 'Générez des cartes imprimables, parfaites quand les téléphones ne suffisent pas.'
  },
  {
    icon: Angry,
    title: 'Gérez votre réputation',
    body: 'Mettez en avant les avis positifs et soignez votre image en ligne.'
  },
  {
    icon: MessageSquare,
    title: 'Recontactez et fidélisez',
    body: 'Envoyez des messages personnalisés pour inciter vos clients à revenir.'
  },
  {
    icon: Award,
    title: 'Améliorez votre référencement',
    body: 'Progressez sur Google grâce aux avis clients qui renforcent votre crédibilité.'
  },
  {
    icon: Gauge,
    title: 'Suivez chaque détail',
    body: 'Analysez vos performances pour décider en toute simplicité.'
  }
];

/**
 * Dense typographic feature index. A two-column list with hairline row dividers
 * (not a grid of equal cards): quiet lucide icons in the brand gold, tight
 * vertical rhythm, wide measure held in check.
 */
export default function V2Features() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <h2 className="font-serif-display max-w-[22ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
            Bien plus qu&apos;un simple menu QR.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-16 md:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 2) * 0.05}>
                <div className="flex gap-4 border-t border-border py-6">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
