'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useMemo } from 'react';
import { useI18n } from '@/lib/i18n';



interface AreaChartProps {
  data: { day: string; jour: number; nuit: number }[]; // Define the prop type for data
}

export function AreaGraph({ data }: AreaChartProps) {
  const { t } = useI18n();

  // Built inside the component because the series labels are translated and must
  // be recomputed when the locale changes.
  const chartConfig = useMemo(
    () =>
      ({
        nuit: { label: t('charts.night'), color: 'hsl(var(--chart-1))' },
        jour: { label: t('charts.day'), color: 'hsl(var(--chart-2))' }
      }) satisfies ChartConfig,
    [t]
  );

  const isEmpty =
    !data ||
    data.length === 0 ||
    data.every((d) => (d.jour ?? 0) === 0 && (d.nuit ?? 0) === 0);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-2 border-b p-0 sm:flex-row sm:space-y-0">
        <div className="flex flex-1 flex-col justify-center gap-2 px-6 py-5 sm:py-6">
          <CardTitle>{t('charts.dayNight.title')}</CardTitle>
          <CardDescription>
            {t('charts.dayNight.desc')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {isEmpty ? (
          <div className="flex h-[310px] items-center justify-center text-sm text-muted-foreground">
            {t('charts.empty')}
          </div>
        ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[310px] w-full"
        >
          <AreaChart
            accessibilityLayer
            data={data}
           
            margin={{
              left: 12,
              right: 12,
              top:12,
              bottom:12
            }}
            
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="jour"
              type="natural"
              fill="var(--color-jour)"
              fillOpacity={0.4}
              stroke="var(--color-jour)"
              stackId="a"
            />
            <Area
              dataKey="nuit"
              type="natural"
              fill="var(--color-nuit)"
              fillOpacity={0.4}
              stroke="var(--color-nuit)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-xs">
          <div className="grid gap-2">

            
            <div className="leading-none text-muted-foreground">
              {t('charts.dayNight.legend')}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
