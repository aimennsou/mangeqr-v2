/**
 * The dashboard content column — ONE definition, shared by `ContentLayout`
 * (the page body) and `Navbar` (the sticky header row).
 *
 * It lives in its own module rather than in `content-layout.tsx` because
 * `content-layout` imports `Navbar`: exporting it from there and importing it
 * back into the navbar would make those two files a circular pair.
 *
 * WHY THIS EXISTS AT ALL — the two used to size themselves independently. The
 * navbar row was `mx-4 sm:mx-8` (measured from the window edge) while the page
 * body was Tailwind's `container` (a centred, max-width column). Past ~1400px
 * those stop agreeing, so the navbar's buttons drifted out toward the window
 * edge while the content below stayed in its column — header and body on two
 * different grids.
 *
 * Two further problems with `container` here:
 *  - `tailwind.config.ts` sets `container.padding = '2rem'`, so the old
 *    `container px-4 sm:px-8` declared horizontal padding TWICE on one element.
 *    It only resolved the way it did because Tailwind emits utilities after
 *    components — invisible from the markup, and a trap for the next edit.
 *  - `container` steps its max-width at every breakpoint, so the column width
 *    jumped as the viewport crossed 640 / 768 / 1024px.
 *
 * A plain `mx-auto max-w-[1400px]` keeps the same 1400px ceiling (the value the
 * config set for 2xl) and grows smoothly below it.
 */
export const PAGE_CONTAINER =
  "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8";
