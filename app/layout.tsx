import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';

import './globals.css';
import { auth } from '@/auth';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/mode-toggle';
import HolyLoader from "holy-loader";
import CookieConsent from '@/components/CookieConsent';
import { DM_Sans } from "next/font/google";


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


const inter =  DM_Sans({
  subsets: ["latin"],
  weight: "400"
});

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
    <html
      lang="en"
      className={`${inter.className}`}
      suppressHydrationWarning
    >      <body
        className={cn(
          "min-h-screen bg-background  antialiased",
       
        )}
      >
          <ThemeProvider>
            <CookieConsent/>
          <HolyLoader color='#facc15' />            {children}
            <Toaster richColors/>
          </ThemeProvider>
         
        </body>
      </html>
    </SessionProvider>
  );
}


