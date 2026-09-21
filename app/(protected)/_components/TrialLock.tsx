'use client';

import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { signOut } from '@/actions/sign-out';

/**
 * Full-screen trial-expired lock (onboarding-style). Shown across the whole
 * protected app when the owner's FREE trial has ended: a blurred/dimmed
 * backdrop with a centered dialog explaining the expiry and an upgrade CTA. No
 * navigation or editing is reachable behind it.
 *
 * `owner` is false for a MEMBER whose owner's trial lapsed (they can't upgrade
 * — only the owner can — so we tailor the copy).
 */
export function TrialLock({ owner = true }: { owner?: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Dimmed, blurred backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[#faf7f2]/80 backdrop-blur-md dark:bg-neutral-950/80"
      />

      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
          <Lock className="h-8 w-8" />
        </span>

        <h1 className="mt-6 font-serif-display text-3xl font-light tracking-tight text-foreground">
          Votre essai gratuit est terminé
        </h1>

        {owner ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Votre période d&apos;essai de 30 jours a pris fin. Pour réactiver
              votre menu et retrouver l&apos;accès à votre espace, passez au
              forfait Starter.
            </p>
            <Link href="/settings" className="mt-6 block">
              <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90">
                <Sparkles className="mr-2 h-4 w-4" />
                Passer au forfait Starter
              </Button>
            </Link>
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            L&apos;essai gratuit de cet espace est terminé. Contactez le
            propriétaire du compte pour réactiver l&apos;accès.
          </p>
        )}

        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
