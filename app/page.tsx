import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { currentUser } from '@/lib/authentication';
import { translate } from '@/lib/i18n/translate';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  type Locale
} from '@/lib/i18n/config';
import V2Nav from './v2/_components/V2Nav';
import V2Hero from './v2/_components/V2Hero';
import V2Values from './v2/_components/V2Values';
import V2Editor from './v2/_components/V2Editor';
import V2Demo from './v2/_components/V2Demo';
import V2Proof from './v2/_components/V2Proof';
import V2Features from './v2/_components/V2Features';
import V2GoogleMaps from './v2/_components/V2GoogleMaps';
import V2Reach from './v2/_components/V2Reach';
import V2PrintedMenus from './v2/_components/V2PrintedMenus';
import V2Reputation from './v2/_components/V2Reputation';
import V2Pricing from './v2/_components/V2Pricing';
import V2Kit from './v2/_components/V2Kit';
import V2Faq from './v2/_components/V2Faq';
import V2Cta from './v2/_components/V2Cta';
import V2Footer from './v2/_components/V2Footer';
import { JsonLd } from '@/components/seo/JsonLd';

/**
 * Home page (/) — the editorial-warm landing (formerly /v2, now the standard):
 * warm cream canvas, off-black text, one gold accent, Cormorant serif display
 * for headlines. Section sequence varies composition so no two adjacent
 * sections share a layout.
 */
/**
 * Locale-aware document metadata, resolved from the persisted locale cookie.
 *
 * CAVEAT (SEO): locale is stored in a cookie, not in the URL, so every language
 * is served from the same `/`. Crawlers arrive without the cookie and therefore
 * only ever index the French version — this makes the tab title and shared-link
 * previews correct for a visitor, but it does NOT give Arabic or English organic
 * visibility. Real multilingual SEO needs locale-prefixed paths (/ar, /en) or
 * per-locale subdomains plus hreflang alternates; that is a routing change, not
 * a metadata one.
 */
export async function generateMetadata(): Promise<Metadata> {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  const title = t('landing.meta.title');
  const description = t('landing.meta.description');

  return {
    title,
    description,
    openGraph: {
      url: 'https://www.mangeqr.com/',
      locale,
      title,
      description,
      images: [
        {
          url: 'https://www.mangeqr.com/og-image.png',
          width: 1200,
          height: 630,
          alt: t('landing.meta.ogAlt')
        }
      ]
    }
  };
}

/**
 * Landing structured data: who we are (Organization) and what this page is
 * selling (SoftwareApplication), plus the FAQ so the questions are eligible for
 * an FAQ rich result.
 *
 * The FAQ text is duplicated here in French rather than read from the dictionary
 * because this is a SERVER component and the block is emitted once per request
 * for crawlers, which only ever see the default locale anyway (locale lives in a
 * cookie — see generateMetadata below). Keep in sync with landing.faq.* if the
 * questions change.
 */
function buildLandingJsonLd() {
  const baseUrl = 'https://www.mangeqr.com';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'MangeQR',
        url: baseUrl,
        logo: `${baseUrl}/og-image.png`,
        areaServed: ['FR', 'DZ'],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'MangeQR',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: baseUrl,
        publisher: { '@id': `${baseUrl}/#organization` },
        description:
          'Créez des menus numériques et physiques, collectez des avis clients et suivez vos performances. Une carte toujours à jour, sans réimpression.',
        offers: {
          '@type': 'Offer',
          price: '12',
          priceCurrency: 'EUR',
        },
      },
    ],
  };
}

export default async function HomePage() {
  // Detect a signed-in visitor so the nav shows a single "Aller à mon compte"
  // button instead of sign-in / sign-up. Route by role.
  const user = await currentUser();
  const accountHref = !user
    ? null
    : user.role === 'SUPERADMIN'
      ? '/superadmin'
      : user.role === 'STAFF'
        ? '/superadmin/leads'
        : '/performances';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={buildLandingJsonLd()} />
      <V2Nav accountHref={accountHref} />
      <main>
        <V2Hero />
        <V2Values />
        <V2Editor />
        <V2Demo />
        <V2Proof />
        <V2Reputation />
        <V2Features />
        <V2GoogleMaps />
        <V2Reach />
        <V2PrintedMenus />
        <V2Pricing />
        <V2Kit />
        <V2Faq />
        <V2Cta />
      </main>
      <V2Footer />
    </div>
  );
}
