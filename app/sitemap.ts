import { type MetadataRoute } from 'next';

import { db } from '@/lib/db';
import { isTrialExpired } from '@/lib/plan';

/**
 * sitemap.xml
 *
 * Enumerates every publicly-crawlable page so search engines discover the full
 * content surface. Each diner-facing restaurant menu is a real content page
 * (restaurant name, address, dishes, prices) and is enumerated dynamically.
 *
 * Hreflang alternates are declared on static routes that have locale variants
 * (/ ↔ /lp/ar) so Google can serve the right version in French vs Arabic SERPs.
 *
 * Excluded on purpose:
 *  - restaurants whose owner's FREE trial has expired (their public menu is
 *    hidden by getPublicMenuData, so indexing them would surface a dead page),
 *  - restaurants with no ACTIVE menu (nothing to show),
 *  - the authenticated app, /api, /order/<uuid>, /tv, /borne (see robots.ts),
 *  - /go/fr and /go/ar (paid-ads funnels, explicitly noindex in their metadata),
 *  - /cgu (placeholder, noindex until real terms are written),
 *  - /v2 (permanent redirect to /).
 */
export const revalidate = 3600; // regenerate at most hourly

const BASE_URL = 'https://www.mangeqr.com';

/**
 * Public marketing pages that should always be listed, with hreflang alternates
 * where applicable. Google reads alternates from sitemaps OR from <link> tags;
 * declaring them in both maximises discoverability.
 */
const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  alternates?: Record<string, string>;
}[] = [
  {
    path: '/',
    priority: 1,
    changeFrequency: 'weekly',
    alternates: {
      'fr-FR': BASE_URL,
      'ar-DZ': `${BASE_URL}/lp/ar`,
      'x-default': BASE_URL,
    },
  },
  {
    path: '/lp/ar',
    priority: 0.9,
    changeFrequency: 'weekly',
    alternates: {
      'ar-DZ': `${BASE_URL}/lp/ar`,
      'fr-FR': BASE_URL,
      'x-default': BASE_URL,
    },
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const routes: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${BASE_URL}${r.path === '/' ? '' : r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
    ...(r.alternates
      ? {
          alternates: {
            languages: r.alternates,
          },
        }
      : {}),
  }));

  // ---- Diner-facing menus (dynamic) ----
  // Best-effort: a sitemap must never break the build or the route, so any DB
  // failure just yields the static list.
  try {
    const restaurants = await db.restaurant.findMany({
      where: {
        menus: { some: { state: 'ACTIVE' } },
      },
      select: {
        id: true,
        updatedAt: true,
        user: { select: { plan: true, planRenewsAt: true } },
      },
      // Guard against an unbounded sitemap; 50 000 URLs is the spec limit.
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
        url: `${BASE_URL}/restaurant/${r.id}`,
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
