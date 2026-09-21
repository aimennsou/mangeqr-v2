'use client';

import Link from 'next/link';

import TemplateThumbnail from '../../(protected)/cartes/_components/TemplateThumbnail';
import { MENU_TEMPLATES } from '../../(protected)/cartes/_templates/registry';
import type { PhysicalMenuData } from '../../(protected)/cartes/_templates/types';
import Reveal from './Reveal';
import V2Button from './V2Button';

// Sample menu used to render the printable-template previews on the landing —
// the same template components restaurateurs use in the app, so the showcase is
// a real render, not a mockup.
const SAMPLE_MENU: PhysicalMenuData = {
  restaurantName: 'Le Petit Gourmet',
  address: '12 rue des Oliviers',
  phone: '+213 5 00 00 00',
  website: 'lepetitgourmet.mangeqr.com',
  currencySymbol: '€',
  menuName: 'Carte',
  categories: [
    {
      id: 'c1',
      name: 'Entrées',
      dishes: [
        { id: 'd1', name: 'Bruschetta', description: 'Tomates fraîches, basilic', price: 7.5 },
        { id: 'd2', name: 'Soupe du jour', description: 'Préparée le matin', price: 4.5 },
        { id: 'd3', name: 'Salade César', description: 'Poulet, parmesan, croûtons', price: 9 },
      ],
    },
    {
      id: 'c2',
      name: 'Plats',
      dishes: [
        { id: 'd4', name: 'Steak frites', description: 'Entrecôte, frites maison', price: 18.5 },
        { id: 'd5', name: 'Risotto aux cèpes', description: 'Crémeux, parmesan', price: 15 },
        { id: 'd6', name: 'Poisson du marché', description: 'Selon arrivage', price: 19 },
      ],
    },
    {
      id: 'c3',
      name: 'Desserts',
      dishes: [
        { id: 'd7', name: 'Crème brûlée', description: 'Vanille de Madagascar', price: 6.5 },
        { id: 'd8', name: 'Tiramisu', description: 'Recette maison', price: 6 },
      ],
    },
  ],
};

// A few showcase designs (from the real template registry).
const SHOWCASE_IDS = ['elegant', 'moderne', 'bistro', 'elegant-dore'];

export default function V2PrintedMenus() {
  const showcase = SHOWCASE_IDS.map((id) =>
    MENU_TEMPLATES.find((t) => t.id === id)
  ).filter((t): t is (typeof MENU_TEMPLATES)[number] => Boolean(t));

  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
            Menu physique
          </p>
          <h2 className="font-serif-display mt-4 max-w-[20ch] text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
            Des menus prêts à imprimer, à votre image.
          </h2>
          <p className="mt-5 max-w-[62ch] text-lg font-light leading-relaxed text-muted-foreground">
            Choisissez un design, votre carte se met en page automatiquement à
            partir de vos plats. Téléchargez le PDF ou commandez une impression
            professionnelle — sans logiciel de mise en page.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {showcase.map((tpl, i) => (
            <Reveal key={tpl.id} delay={i * 0.06}>
              <figure className="group flex flex-col">
                <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                  <TemplateThumbnail
                    templateId={tpl.id}
                    data={SAMPLE_MENU}
                    width={320}
                    heightRatio={0.86}
                  />
                </div>
                <figcaption className="mt-3">
                  <p className="text-sm font-semibold text-foreground">
                    {tpl.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {tpl.description}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-12 flex justify-center">
            <V2Button href="/auth/sign-up">Concevoir mon menu imprimé</V2Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
