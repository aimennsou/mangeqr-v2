import type { getPublicMenuData } from './menu-data';

type PublicMenuData = NonNullable<Awaited<ReturnType<typeof getPublicMenuData>>>;

/**
 * Build schema.org `Restaurant` + `hasMenu` structured data for a diner menu.
 *
 * This is the highest-value SEO artifact in the product: it lets Google
 * understand the restaurant as a place (name, address, phone) AND read the menu
 * sections, dish names, descriptions and prices, which is what powers menu rich
 * results. Without it a menu page is just an opaque client-rendered list.
 *
 * Only data the owner already publishes is included. Prices use the restaurant's
 * ISO currency; `currency` on the returned data is a display SYMBOL, so the ISO
 * code is derived separately.
 */
export function buildRestaurantJsonLd(
  data: PublicMenuData,
  opts: { url: string; currencyCode: string }
): Record<string, unknown> {
  const sections = data.menus.flatMap((menu) =>
    menu.categories.map((category) => ({
      '@type': 'MenuSection',
      name: category.name,
      hasMenuItem: category.dishes.map((dish) => ({
        '@type': 'MenuItem',
        name: dish.name,
        ...(dish.description ? { description: dish.description } : {}),
        offers: {
          '@type': 'Offer',
          price: dish.price,
          priceCurrency: opts.currencyCode,
        },
        ...(dish.photo ? { image: dish.photo } : {}),
      })),
    }))
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: data.name,
    url: opts.url,
    ...(data.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: data.address,
          },
        }
      : {}),
    ...(data.phone ? { telephone: data.phone } : {}),
    ...(data.coverUrl ? { image: data.coverUrl } : {}),
    ...(data.website ? { sameAs: [data.website] } : {}),
    // Menus are grouped into one Menu with a section per category, which is how
    // Google's menu documentation models it.
    hasMenu: {
      '@type': 'Menu',
      ...(sections.length > 0 ? { hasMenuSection: sections } : {}),
    },
  };
}
