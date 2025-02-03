'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';

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


interface PieChartProps {
  data: { day: string; visits: number }[]; // Define the prop type for data
}

const chartConfig = {
  visits: {
    label: 'Visites'
  },
  Weekend: {
    label: 'Weekend',
    color: 'hsl(var(--chart-1))'
  },
  Weekday: {
    label: 'Semaine',
    color: 'hsl(var(--chart-3))'
  }
} satisfies ChartConfig;

export function PieGraph({ data }: PieChartProps) {
  const totalVisits = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.visits, 0);
  }, [data]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-start pb-0">
        <CardTitle> Visiteurs par période de la semaine : Weekend vs En Semaine</CardTitle>
        <CardDescription>Affichage des visiteurs sur la période selectionnée</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[360px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
           data={data}
           dataKey="visits"
           nameKey="day"
           innerRadius={70}
           strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalVisits.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Visiteurs / semaine
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-xs">
   
      <div className="leading-none text-muted-foreground">
              <strong>Semaine:</strong> de Lundi au Vendredi | <strong>Week End:</strong> de Samedi au Dimanche
            </div>
      </CardFooter>
    </Card>
  );
}