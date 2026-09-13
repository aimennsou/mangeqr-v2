"use client";

import { UserButton } from "@/components/auth/user-button";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TourHelpButton } from "@/components/tour-help-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";

/**
 * Client-side navbar action cluster. Groups the language switcher, theme toggle,
 * guided-tour help button and account menu.
 *
 * FEAT-1: carries the `data-tour` anchors used by the welcome tour.
 * FEAT-2: adds clarifying tooltips on controls whose purpose isn't obvious.
 */
export function NavbarActions() {
  const { t } = useI18n();

  return (
    <TooltipProvider disableHoverableContent>
      <div className="flex flex-1 items-center space-x-2 justify-end">
        <TourHelpButton />

        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <span data-tour="lang" className="inline-flex">
              <LanguageSwitcher />
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("tooltip.language")}</TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <span data-tour="theme" className="inline-flex">
              <ModeToggle />
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("tooltip.theme")}</TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <UserButton />
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("tooltip.account")}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
