'use client';

import { useEffect, useState } from 'react';

import PhoneFrame from '@/components/mockups/PhoneFrame';
import { appearanceTheme } from '@/lib/menu-appearance';
import { PublicMenu, type PublicMenuProps } from '@/app/restaurant/[id]/_components/PublicMenu';

/**
 * The diner menu as it is served to a visitor: bare on a phone, inside a device
 * frame on a desktop.
 *
 * WHY
 * ---
 * The menu is a 512px column designed for a handset. Opened on a laptop it
 * stretched down the middle of a wide empty page, which read as a broken layout
 * rather than a phone-first design. Desktop visitors now get the same device
 * frame the landing page uses, so the context is obvious.
 *
 * MOBILE MUST STAY UNFRAMED, and that is the whole difficulty. A frame is a
 * fixed-height scroll container, which changes where `position: sticky` and
 * `position: fixed` resolve. On a phone the sticky header has to pin to the
 * VIEWPORT and the cart button has to float above it; inside a frame both must
 * resolve against the frame instead. One render tree cannot be both, so:
 *
 *   - LAYOUT is switched with CSS (`max-md:` strips the bezel and the inner
 *     scroller). No JS, so there is no unstyled flash on first paint.
 *   - OVERLAY positioning is switched with the `framed` prop, which needs a
 *     media query and is therefore false until after mount. That is safe
 *     because it only affects things the visitor has to open — by the time any
 *     overlay exists the effect has long since run.
 *
 * Deliberately NOT applied to /tv or /borne: those render on in-store hardware
 * where full-bleed is the point, and neither uses this component.
 */
export default function DinerMenuScreen(props: PublicMenuProps) {
  const theme = appearanceTheme(props.menuAppearance);

  // The frame's screen element — the portal target that keeps the dish dialog
  // and cart sheet inside the phone instead of over the whole page.
  const [screenEl, setScreenEl] = useState<HTMLDivElement | null>(null);

  // The element that actually scrolls at md+. The menu needs it for the category
  // chips and for both IntersectionObserver roots; see PublicMenu's `scrollRoot`.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  // Matches the `md:` breakpoint used by the classes below. Keep the two in
  // sync: if they disagree, the overlays position against the wrong box.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktop(mql.matches);
    sync();
    // Tracks live resizes, so dragging a window across the breakpoint doesn't
    // leave the cart button pinned to the wrong box.
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);

  return (
    <div
      // The backdrop colour is set as a custom property and only consumed at
      // md+. Setting `backgroundColor` inline instead would win over any
      // `max-md:` class (inline styles beat classes), tinting the phone page too.
      style={{ ['--diner-backdrop' as string]: theme.surface }}
      className="md:flex md:min-h-screen md:items-center md:justify-center md:bg-[var(--diner-backdrop)] md:p-8"
    >
      <PhoneFrame
        // Taller and wider than the marketing mockups' 300x600: this is a real
        // menu to be read, not a thumbnail.
        className="md:h-[780px] md:w-[390px] max-md:h-auto max-md:w-full max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none"
        // The screen is a flex column: a fixed status-bar strip, then the
        // scroller. It is NOT the scroll container itself — see the strip below.
        //
        // `relative` so the contained overlays, which portal into this element,
        // resolve their `absolute` positioning against the screen rather than
        // against the frame's border box 12px outside it.
        //
        // `isolate` is load-bearing, not decoration. The menu's sticky header
        // uses `backdrop-blur`, and an element with a backdrop-filter is
        // routinely painted OUTSIDE an ancestor's border-radius clip unless that
        // ancestor forms its own stacking context — which showed up as two hard
        // square corners at the top of the bezel. `isolation: isolate` forces
        // the context so the blur is clipped to the rounded screen.
        //
        // Radius is 2.25rem, not PhoneFrame's default 2.2rem: the frame is
        // rounded-[3rem] (48px) with a 12px border, so its true inner radius is
        // 36px. The 0.8px shortfall left a hairline of bezel in the corners.
        screenClassName="relative isolate flex flex-col md:rounded-[2.25rem] max-md:h-auto max-md:overflow-visible max-md:rounded-none"
        notchClassName="max-md:hidden"
        // Painted to match the menu so a menu shorter than the frame doesn't
        // leave a white band under its own background.
        screenStyle={{ backgroundColor: theme.background }}
        // The real menu is multilingual and must flip to RTL in Arabic, unlike
        // the fixed French screenshots the mockups show.
        lockDirection={false}
        screenRef={setScreenEl}
      >
        {/* Status-bar strip, desktop only.
            The notch is drawn at top-2 with h-6, so it covers the first 32px of
            the screen — which is exactly where the menu's own sticky header sits,
            putting the dynamic island straight through the restaurant name and
            the language switcher. h-9 clears it with a little air.

            It has to live OUTSIDE the scroller. Padding the menu instead would
            scroll away on the first swipe and slide the sticky header right back
            under the notch. On a real phone the device's own status bar does
            this job, which is why it is md-only. */}
        <div aria-hidden className="hidden shrink-0 md:block md:h-9" />

        {/* The scroll container at md+, which is what `sticky` inside the menu
            then resolves against. Below md it has no overflow, so the page
            scrolls and the menu's sticky header pins to the viewport as always.
            `min-h-0` lets it actually shrink inside the flex column instead of
            overflowing the frame.

            The scrollbar is hidden for the same reason the category rail hides
            its own: a native Windows scrollbar renders stepper arrows and a
            square track hard against the screen edge, which broke the corners.
            Same technique as PublicMenu's chip rail. `overscroll-contain` stops
            a scroll that reaches the end of the menu from chaining out and
            scrolling the page behind the phone. */}
        <div
          ref={setScrollEl}
          className="min-h-0 flex-1 overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-y-auto"
        >
          <PublicMenu
            {...props}
            framed={isDesktop}
            overlayContainer={screenEl}
            // Only when the frame is live. Below md this div does not scroll —
            // the page does — so the menu must keep using the window.
            scrollRoot={isDesktop ? scrollEl : null}
          />
        </div>
      </PhoneFrame>
    </div>
  );
}
