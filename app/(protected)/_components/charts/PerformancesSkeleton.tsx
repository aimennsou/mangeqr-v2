import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Pulsating placeholder for the WHOLE performances dashboard while it loads:
 * the restaurant selector, 4 KPI cards, the bar + area charts, and the bottom
 * row (pie chart + recent reviews). Mirrors the real layout section by section.
 */
export default function PerformancesSkeleton() {
  return (
    <div className="space-y-4">
      {/* Restaurant selector */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:w-[260px]" />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-5 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar + Area charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCardSkeleton barsHeight />
        <ChartCardSkeleton />
      </div>

      {/* Pie + Recent reviews */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            {/* Donut placeholder */}
            <div className="relative flex h-56 w-56 items-center justify-center">
              <Skeleton className="h-56 w-56 rounded-full" />
              <div className="absolute h-28 w-28 rounded-full bg-card" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// A chart card placeholder: header text + a plotting area. When `barsHeight`,
// the plotting area shows staggered "bars" to evoke the bar chart.
function ChartCardSkeleton({ barsHeight = false }: { barsHeight?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </CardHeader>
      <CardContent>
        {barsHeight ? (
          <div className="flex h-[280px] items-end gap-1.5 px-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-full rounded-sm"
                style={{ height: `${30 + ((i * 37) % 70)}%` }}
              />
            ))}
          </div>
        ) : (
          <Skeleton className="h-[280px] w-full rounded-lg" />
        )}
      </CardContent>
    </Card>
  );
}
