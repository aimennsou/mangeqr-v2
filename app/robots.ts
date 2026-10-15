import type { MetadataRoute } from 'next';

/**
 * robots.txt
 *
 * Previously this allowed `/` with an empty disallow, i.e. everything — so
 * crawlers spent budget on the authenticated dashboard, the superadmin console
 * and /api, and could surface sign-in URLs carrying `?callbackUrl=` params in
 * search results. Those routes are auth-gated and redirect, but telling crawlers
 * not to fetch them at all is both cheaper and cleaner.
 *
 * Crawlable on purpose: the landing (/), the ads funnels (/go/*, /lp/*) and every
 * diner-facing menu (/restaurant/<id>, plus per-restaurant subdomains such as
 * artisto.mangeqr.com — separate hosts that serve this same file through the
 * middleware rewrite).
 *
 * CAREFUL — `/restaurant` is overloaded:
 *   /restaurant        -> app/(protected)/restaurant  (owner's private list)
 *   /restaurant/<uuid> -> app/restaurant/[id]         (PUBLIC diner menu)
 * So the bare path must be blocked while the children stay allowed. Search
 * engines resolve conflicts by longest match, so the more specific
 * `Allow: /restaurant/` beats `Disallow: /restaurant` for menu URLs.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.mangeqr.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          // Longer than the `/restaurant` disallow below, so diner menus win.
          '/restaurant/',
        ],
        disallow: [
          // Authenticated owner dashboard.
          '/performances',
          '/restaurant', // bare path only — see the note above
          '/settings',
          '/account',
          '/menu',
          '/categories',
          '/cartes',
          '/numerique',
          '/marketing',
          '/reviews',
          '/commandes',
          '/cuisine',
          '/tables',
          '/organisation',
          '/onboarding',
          // Back office.
          '/superadmin',
          // Auth + invite pages: nothing to index, and they carry callbackUrl
          // and one-time invite codes.
          '/auth/',
          '/team/',
          // API, and per-diner order tracking whose URLs are unguessable uuids.
          '/api/',
          '/order/',
          // In-store display surfaces, not web content.
          '/tv/',
          '/borne/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
