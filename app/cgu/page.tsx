import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation — MangeQR',
  description:
    'Conditions générales d’utilisation du service MangeQR : menus numériques par QR code, prise de commande et outils associés.',
  // PLACEHOLDER CONTENT — deliberately kept out of search results until the real
  // text is in. Remove this once the terms are written.
  robots: { index: false, follow: true }
};

/**
 * Placeholder Conditions générales d'utilisation.
 *
 * This route exists so the cookie banner has a real target: it linked /cgu, that
 * route did not exist, and the link 404'd — so the link was removed until a page
 * existed. The app has NO other legal pages (mentions légales, politique de
 * confidentialité, politique cookies), which a French SaaS needs.
 *
 * The text below is scaffolding, NOT legal copy. It is marked noindex so a
 * placeholder cannot be indexed as if it were binding terms. Replace the body,
 * drop the notice and the robots directive, then add the sibling legal pages.
 */
export default function CguPage() {
  const sections: { heading: string; body: string }[] = [
    {
      heading: '1. Objet',
      body: 'Les présentes conditions régissent l’accès au service MangeQR et son utilisation par les restaurateurs et leurs clients.'
    },
    {
      heading: '2. Accès au service',
      body: 'Le service est accessible par abonnement. Le restaurateur est responsable de l’exactitude des informations publiées sur ses menus (prix, allergènes, disponibilité).'
    },
    {
      heading: '3. Comptes et sécurité',
      body: 'Le titulaire du compte est responsable de la confidentialité de ses identifiants et des actions effectuées par les membres qu’il invite dans son espace.'
    },
    {
      heading: '4. Données personnelles',
      body: 'Le traitement des données est décrit dans la politique de confidentialité. Les avis et coordonnées collectés via les menus appartiennent au restaurateur.'
    },
    {
      heading: '5. Disponibilité',
      body: 'MangeQR met en œuvre les moyens raisonnables pour assurer la disponibilité du service, sans garantie d’absence d’interruption.'
    },
    {
      heading: '6. Résiliation',
      body: 'L’abonnement peut être résilié selon les modalités du plan souscrit. Les menus publics deviennent alors inaccessibles.'
    },
    {
      heading: '7. Contact',
      body: 'Pour toute question relative aux présentes conditions, contactez l’équipe MangeQR depuis votre espace ou par téléphone.'
    }
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← MangeQR
      </Link>

      <h1 className="mt-8 font-serif-display text-4xl font-medium tracking-tight">
        Conditions générales d’utilisation
      </h1>

      {/* Visible placeholder notice — so nobody mistakes scaffolding for terms. */}
      <p className="mt-6 rounded-xl border border-dashed border-yellow-500/50 bg-yellow-400/10 p-4 text-sm">
        <strong>Document provisoire.</strong> Ce texte est un gabarit et n’a pas
        de valeur contractuelle. Il sera remplacé par les conditions définitives
        avant la mise en service.
      </p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
