import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import { cookies } from 'next/headers';

import './globals.css';
import { auth } from '@/auth';
import { I18nProvider } from '@/lib/i18n';
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirForLocale, isLocale, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/mode-toggle';
import HolyLoader from "holy-loader";
import CookieConsent from '@/components/CookieConsent';
import { DM_Sans, Cormorant_Garamond, Tajawal, Average_Sans } from "next/font/google";


/**
 * Root metadata — the fallback for every page that does not export its own
 * `generateMetadata`. Bilingual (French primary, Arabic secondary) so that:
 *  - Crawlers hitting any un-covered page pick up rich French + Arabic keywords.
 *  - Open Graph declares fr_FR as the primary locale, ar_AR as an alternate.
 *  - Twitter card is set up with a large summary image.
 *  - `alternates.languages` hints to Google that an Arabic version exists.
 *  - `keywords` carries high-value terms in BOTH languages so the page can rank
 *    for "menu QR restaurant" (FR) AND "قائمة طعام رقمية QR" (AR).
 *
 * Individual pages (/, /lp/ar, /restaurant/[id]) override what they need.
 */
const BASE_URL = 'https://www.mangeqr.com';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.AUTH_URL
      ? `${process.env.AUTH_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || 3000}`
  ),
  title: {
    default: 'MangeQR — Menu QR Restaurant Numérique | قائمة مطعم رقمية',
    template: '%s | MangeQR',
  },
  description:
    'Créez votre menu numérique QR en 2 minutes. Solution complète pour restaurants : carte digitale, QR code, avis clients, statistiques. أنشئ قائمة طعام رقمية برمز QR لمطعمك في دقيقتين.',
  keywords: [
    // French high-value keywords
    'menu QR code restaurant',
    'carte numérique restaurant',
    'menu digital restaurant',
    'QR code menu gratuit',
    'carte restaurant en ligne',
    'menu sans contact',
    'digitaliser menu restaurant',
    'solution menu numérique',
    'MangeQR',
    // Arabic high-value keywords
    'قائمة طعام رقمية',
    'قائمة مطعم QR',
    'منيو رقمي مطعم',
    'رمز QR للمطعم',
    'قائمة طعام إلكترونية',
    'منيو الكتروني',
    'تطبيق قائمة مطعم',
    'قائمة QR مجانية',
  ],
  alternates: {
    canonical: BASE_URL,
    languages: {
      'fr-FR': BASE_URL,
      'ar-DZ': `${BASE_URL}/lp/ar`,
    },
  },
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'MangeQR',
    locale: 'fr_FR',
    alternateLocale: ['ar_AR'],
    title: 'MangeQR — Menu QR Restaurant Numérique',
    description:
      'Créez des menus numériques et physiques, collectez des avis clients et suivez vos performances. Une carte toujours à jour, sans réimpression.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'MangeQR — Carte Restaurant Numérique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MangeQR — Menu QR Restaurant Numérique',
    description:
      'Créez votre menu numérique QR en 2 minutes. Solution complète pour restaurants.',
    images: [`${BASE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your Search Console verification tokens here when ready:
    // google: 'YOUR_GOOGLE_VERIFICATION_TOKEN',
  },
  category: 'technology',
};


const inter =  Average_Sans({
  subsets: ["latin"],
  weight: "400"
});

// Elegant, thin high-contrast serif used for the landing hero headline.
// Exposed as a CSS variable so it can be applied via a utility class
// (font-serif-display) without changing the app's default sans body font.
const playfair = Cormorant_Garamond({
  subsets: ["latin"],
  weight: [ "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif-display",
  display: "swap",
});

// Arabic-friendly sans (Tajawal) for the RTL ads landing page. Exposed as a CSS
// variable so the /lp/ar layout can apply it without changing the app default.
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-arabic",
  display: "swap",
});

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Read the persisted locale server-side to render <html lang/dir> correctly
  // on first paint (avoids an RTL/LTR flash) and seed the client provider.
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <AuthProvider session={session}>
    <html
      lang={locale}
      dir={dirForLocale(locale)}
      className={`${inter.className} ${playfair.variable} ${tajawal.variable}`}
      suppressHydrationWarning
    >      <body
        className={cn(
          "min-h-screen bg-background  antialiased",
       
        )}
      >
          <I18nProvider initialLocale={locale}>
          <ThemeProvider>
            <CookieConsent/>
          <HolyLoader color='#facc15' />            {children}
            <Toaster richColors/>
          </ThemeProvider>
          </I18nProvider>
         
        </body>
      </html>
    </AuthProvider>
  );
}


