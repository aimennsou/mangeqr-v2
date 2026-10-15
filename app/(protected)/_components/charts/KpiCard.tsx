import { Card, CardContent } from '@/components/ui/card';
import { FC } from 'react';

interface KpiCardProps {
  title: string;
  number: string | number;
  icon: React.ReactNode;
  description: string;
}

/**
 * Editorial KPI tile. The metric is the focal point — a large Cormorant serif
 * value — with the label as a quiet overline and the icon in a soft gold chip.
 * Depth comes from a hairline border, not a drop shadow, so a wall of these
 * reads as a calm system rather than a grid of boxes.
 */
const KpiCard: FC<KpiCardProps> = ({ title, number, icon, description }) => {
  return (
    <Card className="rounded-xl border-border shadow-none transition-colors hover:border-yellow-400/60">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 [&_svg]:h-4 [&_svg]:w-4 dark:text-yellow-500">
            {icon}
          </span>
        </div>
        <div>
          <div className="font-serif-display truncate text-3xl font-medium leading-none tracking-tight text-foreground">
            {number}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
