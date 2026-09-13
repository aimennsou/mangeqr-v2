'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useI18n } from '@/lib/i18n';

const chartConfig = {
  revenue: {
    label: 'Revenu',
    color: 'hsl(var(--chart-2))'
  }
} satisfies ChartConfig;

interface OrderRevenueChartProps {
  data: { date: string; orders: number; revenue: number }[];
  currency: string;
}

/**
 * FEAT-1 — Daily order revenue bar chart for the performances page. Mirrors the
 * scans BarGraph styling but plots the per-day order revenue.
 */
export function OrderRevenueChart({ data, currency }: OrderRevenueChartProps) {
  const { t } = useI18n();
  const isEmpty = !data || data.length === 0;

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-2 border-b p-0 sm:flex-row sm:space-y-0">
        <div className="flex flex-1 flex-col justify-center gap-2 px-6 py-5 sm:py-6">
          <CardTitle>{t("performances.chart.revenueTitle")}</CardTitle>
          <CardDescription>
            {t("performances.chart.revenueDesc")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {isEmpty ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            {t("performances.chart.ordersEmpty")}
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short'
                  })
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[170px]"
                    nameKey="revenue"
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    }
                    formatter={(value) => `${value} ${currency}`}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" maxBarSize={64} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
