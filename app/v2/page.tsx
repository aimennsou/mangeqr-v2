import type { Metadata } from 'next';

import V2Nav from './_components/V2Nav';
import V2Hero from './_components/V2Hero';
import V2Values from './_components/V2Values';
import V2Editor from './_components/V2Editor';
import V2Proof from './_components/V2Proof';
import V2Features from './_components/V2Features';
import V2Reach from './_components/V2Reach';
import V2Pricing from './_components/V2Pricing';
import V2Faq from './_components/V2Faq';
import V2Cta from './_components/V2Cta';
import V2Footer from './_components/V2Footer';

/**
 * A/B test landing page (variant B) at /v2.
 *
 * Same product + copy as the main home page, rebuilt on a single editorial-warm
 * system: warm cream canvas, off-black text, one gold accent, Cormorant serif
 * display for headlines. The section sequence deliberately varies composition
 * (hero → index → split → bento → feature index → pricing → faq → marquee) so
 * no two adjacent sections share a layout.
 */
export const metadata: Metadata = {
  title: 'MangeQR — Votre carte, en 2 minutes',
  description:
    'Créez des menus numériques et physiques, collectez des avis clients et suivez vos performances. Une carte toujours à jour, sans réimpression.',
  openGraph: {
    url: 'https://www.mangeqr.com/v2',
    title: 'MangeQR — Votre carte, en 2 minutes',
    description:
      'Créez des menus numériques et physiques, collectez des avis clients et suivez vos performances. Une carte toujours à jour, sans réimpression.',
    images: [
      {
        url: 'https://www.mangeqr.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MangeQR — Carte Restaurant Numérique'
      }
    ]
  }
};

export default function V2LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <V2Nav />
      <main>
        <V2Hero />
        <V2Values />
        <V2Editor />
        <V2Proof />
        <V2Features />
        <V2Reach />
        <V2Pricing />
        <V2Faq />
        <V2Cta />
      </main>
      <V2Footer />
    </div>
  );
}
