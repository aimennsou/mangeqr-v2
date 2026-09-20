"use client";

import { useState } from "react";
import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { AppearanceTheme } from "@/lib/menu-appearance";

interface ReviewWidgetProps {
  restaurantId: string;
  googleLink?: string | null;
  /**
   * Derived owner-appearance palette (BUG-7). The review widget is part of the
   * diner menu, so it skins itself from these colors instead of app theme
   * tokens — keeping it readable and independent of the diner's device theme.
   */
  theme: AppearanceTheme;
}

// Ratings at or above this go to the public Google profile; below it, the
// review is captured privately in-app (reputation-management "astuce").
const GOOGLE_THRESHOLD = 4;

export function ReviewWidget({ restaurantId, googleLink, theme }: ReviewWidgetProps) {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const ensureHttp = (url: string) =>
    /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const isHighRating = rating >= GOOGLE_THRESHOLD;
  const routesToGoogle = isHighRating && !!googleLink;

  // 4-5 stars with a Google link: send the diner to Google, and log the
  // positive rating in-app (state GOOGLE) for the owner's analytics.
  const handleGoogle = () => {
    if (!googleLink) return;
    void fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, review: rating, state: "GOOGLE" }),
    }).catch(() => {});
    window.open(ensureHttp(googleLink), "_blank", "noopener,noreferrer");
    setSubmitted(true);
  };

  // Capture a review privately in-app. `positive` marks a happy review that had
  // nowhere public to go (high rating, but the restaurant set no Google link) —
  // it's logged with state GOOGLE so the owner's analytics still count it as a
  // positive review, and it uses the happy (not the "what went wrong") copy.
  const handleInApp = async (positive: boolean) => {
    setSubmitting(true);
    try {
      const isEmail = contact.includes("@");
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          review: rating,
          message: message || undefined,
          clientEmail: isEmail ? contact : undefined,
          clientNumero: !isEmail && contact ? contact : undefined,
          state: positive ? "GOOGLE" : "MANGEQR",
        }),
      });
      if (!response.ok) throw new Error("failed");
      toast.success(t("diner.reviewThanks"));
      setSubmitted(true);
    } catch {
      toast.error(t("diner.reviewError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error(t("diner.selectRating"));
      return;
    }
    if (routesToGoogle) {
      handleGoogle();
    } else {
      // High rating without a Google link => positive flow; low rating =>
      // private "what went wrong" flow.
      void handleInApp(isHighRating);
    }
  };

  if (submitted) {
    return (
      <div
        className="rounded-lg border p-4 text-center"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
          color: theme.text,
        }}
      >
        <p className="font-medium" style={{ color: theme.text }}>
          {t("diner.reviewThanks")}
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: theme.border, backgroundColor: theme.surface }}
    >
      <h3 className="font-semibold" style={{ color: theme.text }}>
        {t("diner.leaveReview")}
      </h3>

      {/* Star selector */}
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Note ${value}`}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                (hovered || rating) >= value
                  ? "fill-yellow-400 text-yellow-400"
                  : ""
              )}
              style={
                (hovered || rating) >= value
                  ? undefined
                  : { color: theme.muted }
              }
            />
          </button>
        ))}
      </div>

      {/* Once a rating is picked, show the matching path. */}
      {rating > 0 && (
        <div className="mt-4">
          {routesToGoogle ? (
            // 4-5 stars -> public Google review
            <div className="space-y-3">
              <p className="text-sm" style={{ color: theme.muted }}>
                {t("diner.reviewShareGoogle")}
              </p>
              <Button
                className="w-full"
                style={{ backgroundColor: theme.accent, color: theme.onAccent }}
                onClick={handleGoogle}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("diner.reviewOnGoogle")}
              </Button>
            </div>
          ) : (
            // Two in-app cases:
            //  - high rating, no Google link  -> POSITIVE thank-you (happy copy)
            //  - low rating (1-3)             -> private "what went wrong"
            <div className="space-y-3">
              <p className="text-sm" style={{ color: theme.muted }}>
                {isHighRating ? t("diner.reviewHappy") : t("diner.reviewHelp")}
              </p>
              <Textarea
                placeholder={
                  isHighRating
                    ? t("diner.happyMessagePlaceholder")
                    : t("diner.messagePlaceholder")
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Input
                placeholder={t("diner.contactPlaceholder")}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
              <Button
                className="w-full"
                style={{ backgroundColor: theme.accent, color: theme.onAccent }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? t("diner.sending") : t("diner.send")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
