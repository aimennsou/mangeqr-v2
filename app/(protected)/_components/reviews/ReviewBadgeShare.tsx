"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface RestaurantOption {
  id: string;
  name: string;
}

export function ReviewBadgeShare({
  restaurants,
  selectedId: controlledId,
}: {
  restaurants: RestaurantOption[];
  /** Controlled selected restaurant id (from the page-level selector at top). */
  selectedId?: string;
}) {
  const selectedId = controlledId || restaurants[0]?.id || "";
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"link" | "iframe" | null>(null);

  // Prefer the configured public app URL; fall back to the current origin.
  useEffect(() => {
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    setOrigin((configured || window.location.origin).replace(/\/$/, ""));
  }, []);

  const badgeUrl = useMemo(
    () => (selectedId && origin ? `${origin}/embed/reviews/${selectedId}` : ""),
    [origin, selectedId]
  );

  const iframeSnippet = useMemo(
    () =>
      badgeUrl
        ? `<iframe src="${badgeUrl}" width="340" height="160" frameborder="0" style="border:0;overflow:hidden" title="Avis MangeQR"></iframe>`
        : "",
    [badgeUrl]
  );

  const copy = (value: string, which: "link" | "iframe") => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(which);
        toast.success("Copié dans le presse-papiers !");
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(() => toast.error("Impossible de copier."));
  };

  if (restaurants.length === 0) return null;

  return (
    <div className="mb-8 rounded-lg border p-4">
      <h3 className="font-semibold">Badge d&apos;avis partageable</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Affichez votre note sur votre site web. Copiez le lien ou le code
        d&apos;intégration.
      </p>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {/* Controls */}
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Lien direct</Label>
            <div className="flex gap-2">
              <Input readOnly value={badgeUrl} />
              <Button
                type="button"
                size="icon"
                className="shrink-0 text-black"
                onClick={() => copy(badgeUrl, "link")}
              >
                {copied === "link" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Code d&apos;intégration (iframe)</Label>
            <div className="flex gap-2">
              <Input readOnly value={iframeSnippet} className="font-mono text-xs" />
              <Button
                type="button"
                size="icon"
                className="shrink-0 text-black"
                onClick={() => copy(iframeSnippet, "iframe")}
              >
                {copied === "iframe" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="grid gap-2">
          <Label>Aperçu</Label>
          <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-3">
            {badgeUrl ? (
              <iframe
                key={badgeUrl}
                src={badgeUrl}
                width={340}
                height={160}
                frameBorder={0}
                style={{ border: 0, overflow: "hidden" }}
                title="Aperçu du badge d'avis"
              />
            ) : (
              <p className="py-8 text-sm text-muted-foreground">
                Sélectionnez un restaurant.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
