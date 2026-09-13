"use client";

import { useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

/**
 * FEAT-1 — First-login welcome / introduction guided tour.
 *
 * Behavior / dismissal contract (localStorage, no DB change):
 *  - Key `mangeqr_tour_dismissed`. If truthy on mount, the tour NEVER starts
 *    automatically again.
 *  - The flag is set to "1" when the user COMPLETES the tour (reaches "Terminer")
 *    OR CLOSES it (X / overlay click / Esc). Either way, it won't nag on the next
 *    load — this satisfies "never show again automatically after the first run".
 *  - Users can always REPLAY it from the help button in the navbar
 *    (`TourHelpButton`), which dispatches the `mangeqr:start-tour` window event.
 *    The replay path clears the flag and starts the tour immediately, so a manual
 *    replay is never blocked by the dismissed flag.
 *
 * SSR/hydration: this is a 'use client' component and all localStorage / driver.js
 * / window access happens inside effects (client-only). Nothing touches `window`
 * during render.
 */

export const TOUR_DISMISSED_KEY = "mangeqr_tour_dismissed";
export const TOUR_START_EVENT = "mangeqr:start-tour";

export function WelcomeTour() {
  const { t } = useI18n();

  useEffect(() => {
    const tr = (key: TranslationKey) => t(key);

    const buildSteps = (): DriveStep[] => {
      const steps: DriveStep[] = [
        {
          // Centered welcome popover (no element).
          popover: {
            title: tr("tour.welcome.title"),
            description: tr("tour.welcome.desc"),
          },
        },
        {
          element: '[data-tour="nav"]',
          popover: {
            title: tr("tour.nav.title"),
            description: tr("tour.nav.desc"),
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="nav-restaurants"]',
          popover: {
            title: tr("tour.restaurants.title"),
            description: tr("tour.restaurants.desc"),
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="nav-menus"]',
          popover: {
            title: tr("tour.menus.title"),
            description: tr("tour.menus.desc"),
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="nav-categories"]',
          popover: {
            title: tr("tour.categories.title"),
            description: tr("tour.categories.desc"),
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="nav-numerique"]',
          popover: {
            title: tr("tour.numerique.title"),
            description: tr("tour.numerique.desc"),
            side: "right",
            align: "start",
          },
        },
        {
          element: '[data-tour="lang"]',
          popover: {
            title: tr("tour.lang.title"),
            description: tr("tour.lang.desc"),
            side: "bottom",
            align: "end",
          },
        },
        {
          element: '[data-tour="theme"]',
          popover: {
            title: tr("tour.theme.title"),
            description: tr("tour.theme.desc"),
            side: "bottom",
            align: "end",
          },
        },
        {
          // Final step — anchored to the help button so users learn where to
          // re-open the guide.
          element: '[data-tour="help"]',
          popover: {
            title: tr("tour.final.title"),
            description: tr("tour.final.desc"),
            side: "bottom",
            align: "end",
          },
        },
      ];

      // Only keep steps whose target actually exists in the current DOM (the
      // welcome/centered step has no element and is always kept). This keeps the
      // tour robust across responsive layouts where some anchors may be hidden.
      return steps.filter(
        (s) => !s.element || !!document.querySelector(s.element as string)
      );
    };

    const startTour = () => {
      const markDismissed = () => {
        try {
          window.localStorage.setItem(TOUR_DISMISSED_KEY, "1");
        } catch {
          /* ignore storage errors (private mode, etc.) */
        }
      };

      const d = driver({
        showProgress: true,
        allowClose: true,
        overlayColor: "rgba(0, 0, 0, 0.6)",
        nextBtnText: tr("tour.next"),
        prevBtnText: tr("tour.prev"),
        doneBtnText: tr("tour.done"),
        // Set the dismissed flag on ANY destroy (completed, closed, Esc, overlay).
        onDestroyed: () => {
          markDismissed();
        },
        steps: buildSteps(),
      });

      d.drive();
    };

    // Auto-start on first visit only.
    const maybeAutoStart = () => {
      let dismissed = false;
      try {
        dismissed = !!window.localStorage.getItem(TOUR_DISMISSED_KEY);
      } catch {
        dismissed = false;
      }
      if (dismissed) return;
      // Defer until the sidebar/navbar anchors are painted.
      requestAnimationFrame(() => {
        // Extra tick so route transitions / lazy layout settle.
        setTimeout(startTour, 400);
      });
    };

    // Replay handler: clear the flag and start immediately.
    const onReplay = () => {
      try {
        window.localStorage.removeItem(TOUR_DISMISSED_KEY);
      } catch {
        /* ignore */
      }
      startTour();
    };

    maybeAutoStart();
    window.addEventListener(TOUR_START_EVENT, onReplay);
    return () => {
      window.removeEventListener(TOUR_START_EVENT, onReplay);
    };
    // Run once on mount; translator identity changes with locale but the tour is
    // a one-shot first-visit experience, so we intentionally don't re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
