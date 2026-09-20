import Image from 'next/image';
import { Tv, MonitorSmartphone, type LucideIcon } from 'lucide-react';

import Reveal from './Reveal';
import V2Button from './V2Button';

/**
 * "Kit restaurateur" — hardware add-ons the team can provide on top of the
 * software: screens (TVs) to showcase menus in the dining room, and self-order
 * kiosks (bornes de commande). Sits right after the pricing section.
 */
interface KitItem {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional showcase image rendered in a container under the description. */
  image?: string;
  imageAlt?: string;
  /** Intrinsic size hint for next/image + max rendered width (px). */
  imageWidth?: number;
  imageHeight?: number;
  imageMaxWidth?: number;
}

const KIT: KitItem[] = [
  {
    icon: Tv,
    title: 'Écrans & TV',
    description:
      "Affichez vos menus et vos promotions sur des écrans en salle. Nous fournissons et installons les TV, votre carte reste synchronisée en temps réel.",
    image: '/images/ecran-tv-menu.jpg',
    imageAlt: 'Écran TV affichant le menu du restaurant en salle',
    imageWidth: 1024,
    imageHeight: 1024,
    imageMaxWidth: 460,
  },
  {
    icon: MonitorSmartphone,
    title: 'Bornes de commande',
    description:
      "Laissez vos clients commander en autonomie sur des bornes tactiles. Moins d'attente, un ticket moyen plus élevé, et vos commandes directement en cuisine.",
    image: '/images/bornes-commande.png',
    imageAlt: 'Bornes de commande tactiles et caisse (POS) pour restaurant',
    imageWidth: 576,
    imageHeight: 820,
    imageMaxWidth: 380,
  },
];

export default function V2Kit() {
  return (
    <section
      id="kit-restaurateur"
      className="border-t border-border bg-background px-6 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
            Kit restaurateur
          </p>
          <h2 className="font-serif-display mt-4 max-w-[20ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
            Au-delà du logiciel, l&apos;équipement de votre salle.
          </h2>
          <p className="mt-6 max-w-[60ch] text-lg font-light leading-relaxed text-muted-foreground">
            En plus de vos menus numériques, nous pouvons équiper votre
            établissement en matériel pour une expérience complète.
          </p>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-4 sm:grid-cols-2">
          {KIT.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={i * 0.08} className="flex">
                <article className="flex w-full flex-col rounded-2xl border border-border bg-card p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>

                  {/* Showcase image container (TV menu board / self-order kiosks) */}
                  {item.image ? (
                    <div className="mt-6 flex min-h-[280px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-b from-muted/40 to-background p-6">
                      <Image
                        src={item.image}
                        alt={item.imageAlt ?? item.title}
                        width={item.imageWidth ?? 576}
                        height={item.imageHeight ?? 820}
                        className="h-auto w-full object-contain"
                        style={{ maxWidth: item.imageMaxWidth ?? 380 }}
                      />
                    </div>
                  ) : null}
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              Écrans TV pour vos menus et bornes de commande sur demande —
              contactez-nous pour un devis adapté à votre salle.
            </p>
            <V2Button href="/auth/sign-up">Demander un devis</V2Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
