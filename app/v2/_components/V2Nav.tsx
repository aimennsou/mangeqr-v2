'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';
import V2FeaturesMenu from './V2FeaturesMenu';

/**
 * Editorial v2 header. Transparent over the hero, then a hairline border + a
 * blurred surface once the page scrolls, so the nav separates from content
 * without a permanent heavy bar.
 */
export default function V2Nav({
  accountHref = null,
}: {
  /** Set when a user is signed in → show a single "Aller à mon compte" button. */
  accountHref?: string | null;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-border bg-background/80 backdrop-blur-md'
          : 'border-b border-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Left: logo + primary menus */}
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/" aria-label="MangeQR" className="flex items-center">
            <Logo />
          </Link>
          <V2FeaturesMenu variant="features" />
          <V2FeaturesMenu variant="usecases" />
        </div>

        {/* Right: pricing + auth */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/#tarifs">
            <Button variant="ghost" className="hidden sm:inline-flex">
              Tarifs
            </Button>
          </Link>
          {accountHref ? (
            <Link href={accountHref}>
              <Button className="bg-yellow-400 text-black hover:bg-yellow-400/90">
                Aller à mon compte
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/sign-in">
                <Button variant="ghost">Se connecter</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="bg-yellow-400 text-black hover:bg-yellow-400/90">
                  Créer un compte
                </Button>
              </Link>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
