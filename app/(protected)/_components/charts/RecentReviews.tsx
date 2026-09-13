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
      <ScrollArea className="h-full px-1">
        <div className="space-y-4">
          {reviews.map((r) => {
            const label = r.clientEmail || r.clientNumero || "Client anonyme";
            return (
              <div key={r.id} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {label.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={
                          i <= r.review
                            ? "h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                            : "h-3.5 w-3.5 text-gray-300"
                        }
                      />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground truncate">
                      {label}
                    </span>
                  </div>
                  {r.message ? (
                    <p className="mt-1 text-sm text-foreground/90">{r.message}</p>
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
