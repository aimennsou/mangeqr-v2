import type { Metadata } from 'next';

import V2Nav from './v2/_components/V2Nav';
import V2Hero from './v2/_components/V2Hero';
import V2Values from './v2/_components/V2Values';
import V2Editor from './v2/_components/V2Editor';
import V2Demo from './v2/_components/V2Demo';
import V2Proof from './v2/_components/V2Proof';
import V2Features from './v2/_components/V2Features';
import V2GoogleMaps from './v2/_components/V2GoogleMaps';
import V2Reach from './v2/_components/V2Reach';
import V2Pricing from './v2/_components/V2Pricing';
import V2Faq from './v2/_components/V2Faq';
import V2Cta from './v2/_components/V2Cta';
import V2Footer from './v2/_components/V2Footer';

/**
 * Home page (/) — the editorial-warm landing (formerly /v2, now the standard):
 * warm cream canvas, off-black text, one gold accent, Cormorant serif display
 * for headlines. Section sequence varies composition so no two adjacent
 * sections share a layout.
 */
export const metadata: Metadata = {
  title: 'MangeQR — Votre carte, en 2 minutes',
  description:
    'Créez des menus numériques et physiques, collectez des avis clients et suivez vos performances. Une carte toujours à jour, sans réimpression.',
  openGraph: {
    url: 'https://www.mangeqr.com/',
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <V2Nav />
      <main>
        <V2Hero />
        <V2Values />
        <V2Editor />
        <V2Demo />
        <V2Proof />
        <V2Features />
        <V2GoogleMaps />
        <V2Reach />
        <V2Pricing />
        <V2Faq />
        <V2Cta />
      </main>
      <V2Footer />
    </div>
  );
}
