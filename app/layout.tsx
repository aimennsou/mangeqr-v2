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


export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.AUTH_URL
      ? `${process.env.AUTH_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3000}`
  ),
  title: 'MangeQr | Ma Carte Restaurant Numérique',
  description:
    'Découvrez MangeQr, votre solution de carte et menu numérique pour restaurants, facile à utiliser et entièrement personnalisable.',
  openGraph: {
    url: 'https://www.mangeqr.com/',
    title: 'MangeQr | Ma Carte Restaurant Numérique',
    description:
      'Découvrez MangeQr, votre solution de carte et menu numérique pour restaurants, facile à utiliser et entièrement personnalisable.',
    images: [
      {
        url: 'https://www.mangeqr.com/og-image.png', // Remplacez par l'URL de votre image OpenGraph
        width: 1200,
        height: 630,
        alt: 'MangeQr - Carte Restaurant Numérique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MangeQr | Ma Carte Restaurant Numérique',
    description:
      'Découvrez MangeQr, votre solution de carte et menu numérique pour restaurants, facile à utiliser et entièrement personnalisable.',
    images: ['https://www.mangeqr.com/og-image.png'], // Remplacez par l'URL de votre image Twitter
  },
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


