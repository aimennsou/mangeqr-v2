import { type MetadataRoute } from 'next';

import { db } from '@/lib/db';
import { isTrialExpired } from '@/lib/plan';

/**
 * sitemap.xml
 *
 * Previously listed only the homepage, which meant the single biggest pool of
 * indexable content — every diner-facing restaurant menu — was invisible to
 * search engines. Each live menu is a real content page (restaurant name,
 * address, dishes, prices), so they are enumerated here.
 *
 * Excluded on purpose:
 *  - restaurants whose owner's FREE trial has expired (their public menu is
 *    hidden by getPublicMenuData, so indexing them would surface a dead page),
 *  - restaurants with no ACTIVE menu (nothing to show),
 *  - the authenticated app, /api, /order/<uuid>, /tv and /borne (see robots.ts).
 *
 * KNOWN LIMITATION — locale: the app stores locale in the `mangeqr_locale`
 * cookie rather than in the URL, so there is exactly one URL per page and no
 * per-locale alternates can be declared here. Crawlers arrive without a cookie
 * and therefore only ever see French. Giving Arabic/English real organic
 * visibility needs locale-prefixed paths (/ar/…, /en/…) or per-locale
 * subdomains, plus hreflang alternates — a routing change, not a sitemap one.
 */
export const revalidate = 3600; // regenerate at most hourly

const baseUrl = 'https://www.mangeqr.com';

/** Public marketing + funnel pages that should always be listed. */
const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/go/fr', priority: 0.7 },
  { path: '/go/ar', priority: 0.7 },
  { path: '/lp/ar', priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${baseUrl}${r.path === '/' ? '' : r.path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: r.priority,
  }));

  // Diner menus. Best-effort: a sitemap must never break the build or the route,
  // so any DB failure just yields the static list.
  try {
    const restaurants = await db.restaurant.findMany({
      where: {
        // Only restaurants that actually have something to show.
        menus: { some: { state: 'ACTIVE' } },
      },
      select: {
        id: true,
        updatedAt: true,
        user: { select: { plan: true, planRenewsAt: true } },
      },
      // Guard against an unbounded sitemap; 50k URLs is the spec limit.
      take: 10000,
    });

    for (const r of restaurants) {
      // Mirror getPublicMenuData: an expired FREE trial hides the menu.
      if (
        isTrialExpired({
          plan: r.user?.plan ?? null,
          planRenewsAt: r.user?.planRenewsAt ?? null,
        })
      ) {
        continue;
      }

      routes.push({
        url: `${baseUrl}/restaurant/${r.id}`,
        lastModified: r.updatedAt,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error('[sitemap] failed to list restaurant menus:', error);
  }

  return routes;
}
