import { db } from "@/lib/db";
import { QrCode, Star } from "lucide-react";

// Public, embeddable reviews badge (rendered inside an <iframe> on the
// restaurant's own site). No auth, no dashboard chrome. Always reflects the
// latest reviews.
export const dynamic = "force-dynamic";

export default async function ReviewsBadgePage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const restaurant = await db.restaurant.findUnique({
    where: { id: params.restaurantId },
    select: { id: true, name: true },
  });

  const reviews = restaurant
    ? await db.review.findMany({
        where: { restaurantId: restaurant.id },
        select: { review: true },
      })
    : [];

  const total = reviews.length;
  const average =
    total > 0 ? reviews.reduce((sum, r) => sum + r.review, 0) / total : 0;
  const rounded = Math.round(average * 10) / 10;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://mangeqr.com").replace(
    /\/$/,
    ""
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-3">
      <a
        href={appUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full max-w-[320px] rounded-xl border bg-white p-4 shadow-sm no-underline transition-shadow hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-800">
            {restaurant?.name ?? "Restaurant"}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
            <QrCode className="h-3.5 w-3.5 text-yellow-400" />
            Mange<span className="text-yellow-500">QR</span>
          </span>
        </div>

        <div className="mt-2 flex items-end gap-2">
          <span className="text-3xl font-bold text-zinc-900">
            {total > 0 ? rounded.toFixed(1) : "—"}
          </span>
          <div className="mb-1 flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={
                  i <= Math.round(average)
                    ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                    : "h-4 w-4 text-zinc-300"
                }
              />
            ))}
          </div>
        </div>

        <p className="mt-1 text-xs text-zinc-500">
          {total > 0
            ? `Basé sur ${total} avis`
            : "Aucun avis pour le moment"}
        </p>
      </a>
    </div>
  );
}
