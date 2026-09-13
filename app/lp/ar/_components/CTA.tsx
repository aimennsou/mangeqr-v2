import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Primary conversion button for the Arabic ads landing page. Repeats across the
 * page (hero, after demo/proof, final). RTL: the arrow points left (forward in
 * Arabic reading direction).
 */
export function CTA({
  children,
  className,
  href = '/auth/sign-up',
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-lg font-bold text-black shadow-lg shadow-yellow-400/30 transition-transform hover:scale-[1.03] active:scale-100',
        className
      )}
    >
      {children}
      <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
    </Link>
  );
}

/** Risk-reducing microcopy shown under CTAs. */
export function TrustMicrocopy({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-neutral-600',
        className
      )}
    >
      <span>✓ بدون بطاقة بنكية</span>
      <span>✓ الإعداد في 5 دقائق</span>
      <span>✓ ضمان 30 يوم</span>
    </p>
  );
}
