"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";
import { TOUR_START_EVENT } from "@/app/(protected)/_admin-panel/welcome-tour";

/**
 * FEAT-1 — manual "Revoir le guide" trigger.
 *
 * Dispatches a `mangeqr:start-tour` window CustomEvent that `WelcomeTour` listens
 * for; the listener clears the dismissed flag and starts the tour. Kept as its own
 * client component so it can live inside the (server) navbar.
 */
export function TourHelpButton() {
  const { t } = useI18n();

  const handleClick = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(TOUR_START_EVENT));
  };

  return (
    <TooltipProvider disableHoverableContent>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            data-tour="help"
            aria-label={t("tooltip.help")}
            className="h-9 w-9 rounded-full p-2"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("tooltip.help")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
