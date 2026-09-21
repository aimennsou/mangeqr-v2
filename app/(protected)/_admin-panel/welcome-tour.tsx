"use client";

import { useEffect } from "react";
import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { useAppRole, useWorkspaceRole } from "@/hooks/use-workspace-role";

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
 * BUG-3 (tour rendered twice): guarded against duplicate driver instances. A
 * module-level `activeDriver` holds the single live instance; `startTour`
 * destroys any existing one before creating a new one, and a `tourStarting`
 * latch prevents the deferred auto-start from firing twice (React 18 StrictMode
 * double-invokes effects in dev, and the effect could otherwise schedule two
 * `driver().drive()` calls).
 *
 * BUG-4 (broken on mobile): on small screens the sidebar nav lives inside a
 * closed Sheet, so its anchors aren't in the DOM. Before building steps we open
 * the mobile menu Sheet (click `[data-tour="mobile-menu-trigger"]`) and then
 * resolve every nav anchor from WITHIN the visible Sheet
 * (`[data-tour-mobile-menu]`), because the hidden desktop sidebar renders the
 * same `data-tour` attributes and would otherwise be matched first.
 *
 * SSR/hydration: this is a 'use client' component and all localStorage / driver.js
 * / window access happens inside effects (client-only). Nothing touches `window`
 * during render.
 */

export const TOUR_DISMISSED_KEY = "mangeqr_tour_dismissed";
export const TOUR_START_EVENT = "mangeqr:start-tour";

// Single live driver instance across the whole app. Prevents two overlapping
// tours (BUG-3). Module-scoped so it survives StrictMode's double effect run.
let activeDriver: Driver | null = null;
// Latch so the deferred auto-start (rAF + setTimeout) can't be scheduled twice.
let tourStarting = false;

const isMobileViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 1023px)").matches; // < lg breakpoint

export function WelcomeTour() {
  const { t } = useI18n();
  // The guided tour is a restaurateur (owner) onboarding experience. It must
  // NOT appear for back-office roles (ADMIN / SUPERADMIN / STAFF) or for team
  // members — its steps point at the restaurateur nav they don't use.
  const appRole = useAppRole();
  const workspaceRole = useWorkspaceRole();
  const isRestaurateurOwner = appRole === "USER" && workspaceRole === "OWNER";

  useEffect(() => {
    // Never auto-start or bind the replay listener for non-restaurateur roles.
    // `appRole` is null until resolved (fail-closed), so we wait for it.
    if (appRole === null) return;
    if (!isRestaurateurOwner) return;

    const tr = (key: TranslationKey) => t(key);

    // Resolve a selector, preferring the visible mobile Sheet on small screens
    // so we don't anchor to the hidden desktop sidebar (which renders the same
    // data-tour attributes). Falls back to a global lookup (desktop / navbar
    // items that live outside the Sheet).
    const resolveEl = (selector: string): Element | null => {
      const sheet = document.querySelector("[data-tour-mobile-menu]");
      if (sheet) {
        const inSheet = sheet.querySelector(selector);
        if (inSheet) return inSheet;
      }
      return document.querySelector(selector);
    };

    // Open the mobile navigation Sheet if we're on a small viewport and it's not
    // already open. Returns true if it triggered an open (so the caller can wait
    // for the Sheet to render before anchoring).
    const openMobileMenuIfNeeded = (): boolean => {
      if (!isMobileViewport()) return false;
      if (document.querySelector("[data-tour-mobile-menu]")) return false; // already open
      const trigger = document.querySelector<HTMLElement>(
        '[data-tour="mobile-menu-trigger"]'
      );
      if (!trigger) return false;
      trigger.click();
      return true;
    };

    // Build a popover description that optionally shows an animated demo (a mock
    // app view with a moving/clicking cursor) above the text. driver.js renders
    // the description as HTML, so we return an HTML string. The SVGs use SMIL so
    // they animate inside <img>. `media` is a path under /public.
    const desc = (text: string, media?: string): string => {
      const img = media
        ? `<img src="${media}" alt="" class="mangeqr-tour-media" style="display:block;width:100%;height:auto;border-radius:10px;border:1px solid rgba(0,0,0,0.08);margin-bottom:10px;background:#faf7f2" />`
        : "";
      return `${img}<span>${text}</span>`;
    };

    const buildSteps = (): DriveStep[] => {
      const steps: DriveStep[] = [
        {
          // Centered welcome popover (no element).
          popover: {
            title: tr("tour.welcome.title"),
            description: desc(tr("tour.welcome.desc")),
          },
        },
        {
          element: () => resolveEl('[data-tour="nav"]') as Element,
          popover: {
            title: tr("tour.nav.title"),
            description: desc(tr("tour.nav.desc")),
            side: "right",
            align: "start",
          },
        },
        {
          element: () => resolveEl('[data-tour="nav-restaurants"]') as Element,
          popover: {
            title: tr("tour.restaurants.title"),
            description: desc(tr("tour.restaurants.desc"), "/images/demos/restaurant.svg"),
            side: "right",
            align: "start",
          },
        },
        {
          element: () => resolveEl('[data-tour="nav-menus"]') as Element,
          popover: {
            title: tr("tour.menus.title"),
            description: desc(tr("tour.menus.desc"), "/images/demos/menu.svg"),
            side: "right",
            align: "start",
          },
        },
        {
          element: () => resolveEl('[data-tour="nav-categories"]') as Element,
          popover: {
            title: tr("tour.categories.title"),
            description: desc(tr("tour.categories.desc"), "/images/demos/categories.svg"),
            side: "right",
            align: "start",
          },
        },
        {
          element: () => resolveEl('[data-tour="nav-numerique"]') as Element,
          popover: {
            title: tr("tour.numerique.title"),
            description: desc(tr("tour.numerique.desc"), "/images/demos/numerique.svg"),
            side: "right",
            align: "start",
          },
        },
        {
          element: () => resolveEl('[data-tour="lang"]') as Element,
          popover: {
            title: tr("tour.lang.title"),
            description: desc(tr("tour.lang.desc")),
            side: "bottom",
            align: "end",
          },
        },
        {
          element: () => resolveEl('[data-tour="theme"]') as Element,
          popover: {
            title: tr("tour.theme.title"),
            description: desc(tr("tour.theme.desc")),
            side: "bottom",
            align: "end",
          },
        },
        {
          // Final step — anchored to the help button so users learn where to
          // re-open the guide.
          element: () => resolveEl('[data-tour="help"]') as Element,
          popover: {
            title: tr("tour.final.title"),
            description: desc(tr("tour.final.desc")),
            side: "bottom",
            align: "end",
          },
        },
      ];

      // Keep the centered welcome step (no element) plus any step whose target
      // currently resolves in the DOM. On mobile the anchors resolve from inside
      // the (now open) Sheet; unresolved anchors are dropped so the tour never
      // points at missing elements (BUG-4).
      return steps.filter((s) => {
        if (!s.element) return true;
        const selectorFn = s.element as () => Element | null;
        return !!selectorFn();
      });
    };

    const markDismissed = () => {
      try {
        window.localStorage.setItem(TOUR_DISMISSED_KEY, "1");
      } catch {
        /* ignore storage errors (private mode, etc.) */
      }
    };

    const runDriver = () => {
      // Destroy any lingering instance before starting a fresh one (BUG-3).
      if (activeDriver) {
        try {
          activeDriver.destroy();
        } catch {
          /* ignore */
        }
        activeDriver = null;
      }

      const d = driver({
        showProgress: true,
        allowClose: true,
        // On-brand popover styling (#4) — see `.mangeqr-tour` in globals.css.
        popoverClass: "mangeqr-tour",
        overlayColor: "rgba(23, 23, 23, 0.65)",
        stagePadding: 6,
        stageRadius: 12,
        nextBtnText: tr("tour.next"),
        prevBtnText: tr("tour.prev"),
        doneBtnText: tr("tour.done"),
        // Set the dismissed flag on ANY destroy (completed, closed, Esc, overlay)
        // and clear the singleton/latch so a later replay can start cleanly.
        onDestroyed: () => {
          markDismissed();
          activeDriver = null;
          tourStarting = false;
        },
        steps: buildSteps(),
      });

      activeDriver = d;
      d.drive();
    };

    const startTour = () => {
      // If a tour is already live or being started, don't start another (BUG-3).
      if (activeDriver || tourStarting) return;
      tourStarting = true;

      // On mobile, open the nav Sheet first, then wait a tick for it to mount
      // before building steps against its anchors (BUG-4).
      const opened = openMobileMenuIfNeeded();
      const delay = opened ? 350 : 0;
      window.setTimeout(runDriver, delay);
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
      if (activeDriver || tourStarting) return; // already running/scheduled
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
    // Re-run when the role resolves (appRole starts null). Translator identity
    // changes with locale but the tour is a one-shot experience, so we don't
    // re-run on that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appRole, isRestaurateurOwner]);

  return null;
}
