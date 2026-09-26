import { cn } from '@/lib/utils';

/**
 * CSS-based iPhone-style frame that renders arbitrary React children inside the
 * screen (unlike the SVG Iphone15Pro, which only takes an image or iframe src).
 * Used to embed the live, interactive menu directly in the landing hero.
 *
 * The screen is pinned to `dir="ltr"`. It depicts a device showing a specific
 * (French) restaurant's menu, and a screenshot does not flip just because the
 * surrounding page is Arabic — the frame itself is positioned by the page's
 * direction, but its CONTENTS keep their own reading order. This also keeps the
 * many physical `left-`/`right-` offsets inside the mockups correct on the
 * Arabic landing without rewriting them as logical properties.
 */
export default function PhoneFrame({
  children,
  className,
  screenClassName,
  notchClassName,
  screenStyle,
  lockDirection = true,
  screenRef,
}: {
  children: React.ReactNode;
  className?: string;
  /** Extra classes on the screen (e.g. to make it scroll, or drop its radius). */
  screenClassName?: string;
  /** Extra classes on the notch (e.g. to hide it at small breakpoints). */
  notchClassName?: string;
  /** Inline screen styles, for callers that theme the screen at runtime. */
  screenStyle?: React.CSSProperties;
  /**
   * Pin the screen to `dir="ltr"`.
   *
   * Correct for the marketing mockups (see the note above) but WRONG for the
   * real diner menu, which is genuinely multilingual and must flip to RTL in
   * Arabic. Those callers pass `false` so the screen inherits page direction.
   */
  lockDirection?: boolean;
  /** Handle on the screen element, for portaling overlays into the frame. */
  screenRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      className={cn(
        'relative mx-auto h-[600px] w-[300px] rounded-[3rem] border-[12px] border-[#404040] bg-[#404040] shadow-2xl',
        className
      )}
    >
      {/* Notch / dynamic island. `left-1/2` + `-translate-x-1/2` centers
          independently of direction, so it needs no RTL handling. */}
      <div
        className={cn(
          'absolute left-1/2 top-2 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-[#262626]',
          notchClassName
        )}
      />
      {/* Screen */}
      <div
        ref={screenRef}
        dir={lockDirection ? 'ltr' : undefined}
        className={cn(
          'h-full w-full overflow-hidden rounded-[2.2rem] bg-white',
          screenClassName
        )}
        style={screenStyle}
      >
        {children}
      </div>
    </div>
  );
}
