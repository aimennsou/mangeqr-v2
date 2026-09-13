'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The v2 primary call-to-action: a large gold pill with a soft colored shadow
 * and a subtle hover lift + arrow nudge. One shared style so every CTA on the
 * page (hero, editor, reach, maps, closing band) is the same big, confident
 * button. Off-black text on gold keeps contrast well above AA.
 */
export default function V2Button({
  href,
  children,
  variant = 'gold',
  className
}: {
  href: string;
  children: ReactNode;
  variant?: 'gold' | 'dark';
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-lg font-bold transition-transform hover:scale-[1.03]',
        variant === 'gold'
          ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/30 hover:bg-yellow-400'
          : 'bg-black text-white shadow-lg shadow-black/20 hover:bg-black/90',
        className
      )}
    >
      {children}
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
