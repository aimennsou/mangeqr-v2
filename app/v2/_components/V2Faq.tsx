import { Plus } from 'lucide-react';

import Reveal from './Reveal';

const FAQS = [
  {
    q: 'Est-ce que MangeQR est une application ?',
    a: "Non. MangeQR n'est pas une application à télécharger : vos clients ne passent pas par l'App Store. Dès qu'ils scannent le code QR, ils arrivent sur une page web avec le menu de votre restaurant."
  },
  {
    q: 'Est-il facile de créer un menu QR ?',
    a: "Oui. MangeQR est pensé pour être simple. Vous créez votre restaurant, ajoutez vos menus et vos plats, et sauvegardez. Le menu est aussitôt mis à jour et synchronisé avec le QR code des tables."
  },
  {
    q: 'Puis-je changer les prix ou les plats après coup ?',
    a: "À tout moment. Un plat n'est plus disponible ? Rendez-vous dans votre espace et masquez-le : il apparaît en grisé pour les clients au lieu de les décevoir à table."
  },
  {
    q: 'Comment je reçois mes QR codes ?',
    a: "Vous téléchargez vos QR codes en JPEG ou PDF directement depuis votre espace. En version BETA, nous vous envoyons aussi un échantillon de stand QR code."
  }
];

/**
 * FAQ as a typographic index using native <details> (accessible, keyboard-ready,
 * no JS, no motion to gate). Hairline dividers, quiet plus marker that rotates
 * on open.
 */
export default function V2Faq() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-12 lg:gap-16 lg:py-32">
        <div className="lg:col-span-4">
          <Reveal>
            <h2 className="font-serif-display text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
              Questions fréquentes
            </h2>
          </Reveal>
        </div>

        <div className="lg:col-span-8">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.04}>
              <details className="group border-b border-border py-5 first:border-t">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-foreground marker:hidden">
                  {item.q}
                  <Plus
                    className="h-5 w-5 shrink-0 text-yellow-500 transition-transform duration-200 group-open:rotate-45"
                    strokeWidth={2}
                  />
                </summary>
                <p className="mt-3 max-w-[62ch] leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
