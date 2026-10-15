'use client';

import Link from 'next/link';

import Logo from '@/components/Logo';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

const LINKS: { key: TranslationKey; href: string }[] = [
  { key: 'landing.nav.pricing', href: '/#tarifs' },
  { key: 'landing.nav.signIn', href: '/auth/sign-in' },
  { key: 'landing.nav.signUp', href: '/auth/sign-up' },
  { key: 'landing.nav.viewMenu', href: '/artisto' }
];

/**
 * Quiet editorial footer coherent with the v2 system.
 *
 * Client component so switching locale re-renders it immediately.
 */
export default function V2Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
        <Link href="/" aria-label="MangeQR" className="flex items-center">
          <Logo />
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} MangeQR
        </p>
      </div>
    </footer>
  );
}
