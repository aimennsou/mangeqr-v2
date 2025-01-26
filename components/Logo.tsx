'use client';

import { QrCode } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center justify-center gap-2 text-zinc-900 duration-200 dark:text-zinc-200',
        className,
      )}
    >
      <div className="mr-4 flex items-center justify-center gap-2 font-bold">
        <QrCode className="h-6 w-6 text-yellow-400" />
        <span className="text-base font-bold">
          Mange
          <span className="text-yellow-500">QR</span>
        </span>
        <Badge variant="outline" className="bg-yellow-400 text-black">
          v1.0
        </Badge>
      </div>
    </Link>
  );
}
