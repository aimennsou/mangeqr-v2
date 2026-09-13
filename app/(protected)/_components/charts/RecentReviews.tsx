"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentReview {
  id: string;
  review: number;
  message?: string | null;
  clientEmail?: string | null;
  clientNumero?: string | null;
  state: string;
  createdAt: string;
  restaurant?: { id: string; name: string } | null;
  restaurantId?: string;
}

// Real "latest reviews" list for the Performances dashboard, replacing the old
// hardcoded fake-sales placeholder. Optionally scoped to a restaurant id.
export function RecentReviews({ restaurantId }: { restaurantId?: string }) {
  const [reviews, setReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/review");
        const data = res.ok ? await res.json() : [];
        if (cancelled) return;
        const list: RecentReview[] = Array.isArray(data) ? data : [];
        setReviews(
          restaurantId
            ? list.filter(
                (r) => (r.restaurant?.id ?? r.restaurantId) === restaurantId
              )
            : list
        );
      } catch {
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
        Chargement des avis...
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
        Aucun avis pour le moment.
      </div>
    );
  }

  return (
    <div className="h-[400px]">
      <ScrollArea className="h-full pr-3">
        <div className="flex flex-col gap-3">
          {reviews.map((r) => {
            const label = r.clientEmail || r.clientNumero || "Client anonyme";
            const date = new Date(r.createdAt);
            const dateStr = Number.isNaN(date.getTime())
              ? null
              : date.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
            return (
              <div
                key={r.id}
                className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {label.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <span className="truncate text-sm font-medium text-foreground">
                      {label}
                    </span>
                    {dateStr ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {dateStr}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={
                          i <= r.review
                            ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                            : "h-4 w-4 text-muted-foreground/30"
                        }
                      />
                    ))}
                  </div>
                  {r.message ? (
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                      {r.message}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
