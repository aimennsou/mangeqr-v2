// Page-level metadata lives in lp/ar/page.tsx (richer, includes OG + Twitter +
// keywords + hreflang). The layout only provides structural chrome.

/**
 * Standalone layout for paid-ads landing pages (/lp/*).
 *
 * It intentionally omits the app navbar/sidebar and any distracting chrome to
 * maximize conversion, and forces RTL + the Arabic font for the Arabic page.
 * (The root layout owns <html>/<body>; this only wraps the page content.)
 */
export default function LpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="ar" className="font-arabic min-h-screen bg-[#faf7f2] text-neutral-900">
      {children}
    </div>
  );
}
