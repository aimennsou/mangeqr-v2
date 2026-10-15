import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';

/**
 * Editorial KPI tile for the superadmin dashboard — a large serif value, a
 * quiet overline label, an optional sub-line, and an icon in a soft gold chip.
 * Matches the owner performances tiles (hairline, no shadow).
 */
export function MetricCard({
  label,
  value,
  sub,
  icon,
  accent
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  /** When true, tint the value gold (for headline metrics like MRR). */
  accent?: boolean;
}) {
  return (
    <Card className="rounded-xl border-border shadow-none">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 [&_svg]:h-4 [&_svg]:w-4 dark:text-yellow-500">
            {icon}
          </span>
        </div>
        <div>
          <div
            className={
              'font-serif-display truncate text-3xl font-medium leading-none tracking-tight ' +
              (accent ? 'text-yellow-600 dark:text-yellow-500' : 'text-foreground')
            }
          >
            {value}
          </div>
          {sub ? (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {sub}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
