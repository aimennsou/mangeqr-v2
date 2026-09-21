'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

// NOTE: Logo renders a plain container (not a <Link>). Callers already wrap it
// in a Next.js <Link>, so making Logo a link too produced invalid nested <a>
// tags and a React hydration error. Keep this as a non-anchor element.
export default function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 text-zinc-900 duration-200 dark:text-zinc-200',
        className,
      )}
    >
      <div className="mr-4 flex items-center justify-center gap-2 font-bold">
        {/* Use the real brand mark (same asset as the favicon) instead of a
            generic QR icon. */}
        <Image
          src="/android-chrome-192x192.png"
          alt="MangeQR"
          width={28}
          height={28}
          className="h-7 w-7 rounded-md"
        />
        <span className="text-base font-bold">
          Mange
          <span className="text-yellow-500">QR</span>
        </span>
      </div>
    </div>
  );
}
