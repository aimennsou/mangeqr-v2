'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

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

export const description = 'An interactive bar chart';

// const chartData = [
//   { date: '2024-04-01', shop1: 222 },
//   { date: '2024-04-02', shop1: 97 },
//   { date: '2024-04-03', shop1: 167 },
//   { date: '2024-04-04', shop1: 242},
//   { date: '2024-04-05', shop1: 373},
//   { date: '2024-04-06', shop1: 301},
// ];

const chartConfig = {
  views: {
    label: 'Scans'
  },
  shop1: {
    label: 'Shop 1',
    color: 'hsl(var(--chart-1))'
  }
} satisfies ChartConfig;


interface BarGraphProps {
  data: { date: string; shop1: number }[]; // Define the prop type for data
}


export function BarGraph({ data }: BarGraphProps) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('shop1');

console.log(data)

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-2 border-b p-0 sm:flex-row sm:space-y-0">
        <div className="flex flex-1 flex-col justify-center gap-2 px-6 py-5 sm:py-6">
          <CardTitle>Nombre de scans par jour</CardTitle>
          <CardDescription>
            Affichage du nombre total de visiteurs par jour pour la période selectionnée
          </CardDescription>
          
        </div>
      
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short'
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      
    </Card>
  );
}

