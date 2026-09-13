import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getS3Url } from "@/lib/s3";
import type { MenuAppearance } from "@/schemas";
import { currencySymbol } from "@/lib/currency";

/**
 * Resolve a stored photo reference to a displayable URL. S3 keys ("uploads/…")
 * go through getS3Url; already-absolute URLs (http/https) and local public
 * paths ("/images/…", used by the demo seed) are passed through unchanged so
 * dummy photos render without S3 configured.
 */
function resolvePhoto(photo: string | null): string | null {
  if (!photo) return null;
  if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
  return getS3Url(photo) || null;
}

// French weekday names, indexed by JS getDay() (0 = Sunday ... 6 = Saturday),
// matching the values stored in Menu.availability.
const FRENCH_DAYS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

// A menu shows today if its availability includes today's French weekday.
// An empty/absent availability list means always available.
function isAvailableToday(availability: string[] | null | undefined): boolean {
  if (!availability || availability.length === 0) return true;
  return availability.includes(FRENCH_DAYS[new Date().getDay()]);
}

/**
 * Fetch a restaurant (by id or subdomain) with its ACTIVE menus -> categories
 * -> dishes, filter menus to those available today, and map it into the props
 * the PublicMenu component expects. Returns null when not found.
 *
 * Shared by both the path-based route (/restaurant/[id]) and the subdomain
 * route (/restaurant/by-subdomain/[subdomain]).
 */
export async function getPublicMenuData(where: Prisma.RestaurantWhereUniqueInput) {
  const restaurant = await db.restaurant.findUnique({
    where,
    include: {
      // Owner account, to know whether ordering is enabled for this account
      // (FEAT-1/D16). Ordering is ON for diners only when BOTH the account and
      // this restaurant have it enabled.
      user: { select: { orderingEnabled: true } },
      // Tables (for the dine-in table picker). Diner-facing: id + label only.
      tables: { select: { id: true, label: true } },
      menus: {
        where: { state: "ACTIVE" },
        orderBy: { position: "asc" },
        include: {
          categories: {
            where: { state: "ACTIVE" },
            orderBy: { position: "asc" },
            include: {
              dishes: {
                where: { state: "ACTIVE" },
                orderBy: { position: "asc" },
                include: {
                  // Add-on groups + options (FEAT-1/D12) for the order builder.
                  addonGroups: {
                    orderBy: { position: "asc" },
                    include: { options: { orderBy: { position: "asc" } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!restaurant) return null;

  // Ordering is available to diners only when the account is enabled AND this
  // restaurant has its per-restaurant toggle on (D9 + D16).
  const orderingEnabled =
    (restaurant.user?.orderingEnabled ?? false) &&
    restaurant.orderingEnabled;

  // Diner table picker list, sorted numerically when labels are numbers.
  const tables = [...restaurant.tables].sort((a, b) => {
    const na = Number(a.label);
    const nb = Number(b.label);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.label.localeCompare(b.label);
  });

  const availableMenus = restaurant.menus.filter((menu) =>
    isAvailableToday(menu.availability)
  );

  // Total favorite (heart) count per dish, so diners can see how many people
  // favorited each dish. One grouped query for the whole restaurant.
  const favoriteGroups = await db.favoriteData.groupBy({
    by: ["dishId"],
    where: { restaurantId: restaurant.id },
    _count: { dishId: true },
  });
  const favoriteCountByDish = new Map<string, number>(
    favoriteGroups.map((g) => [g.dishId, g._count.dishId])
  );

  return {
    restaurantId: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    phone: restaurant.phone,
    coverUrl: resolvePhoto(restaurant.coverPhoto),
    wifi: restaurant.wifi,
    website: restaurant.website,
    instagram: restaurant.instagram,
    tiktok: restaurant.tiktok,
    google: restaurant.google,
    // Saved per-restaurant appearance (D.1 JSON column). Passed through as-is
    // (null when unset); PublicMenu normalizes it against the shared defaults.
    menuAppearance: (restaurant.menuAppearance as MenuAppearance | null) ?? null,
    currency: currencySymbol(restaurant.currency),
    // FEAT-1: diner ordering context.
    orderingEnabled,
    tables: tables.map((t) => ({ id: t.id, label: t.label })),
    menus: availableMenus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      categories: menu.categories.map((category) => ({
        id: category.id,
        name: category.name,
        logo: category.logo,
        dishes: category.dishes.map((dish) => ({
          id: dish.id,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          photo: resolvePhoto(dish.photo),
          allergenes: dish.allergenes,
          favoriteCount: favoriteCountByDish.get(dish.id) ?? 0,
          // Add-on groups for the diner order builder (FEAT-1/D12).
          addonGroups: dish.addonGroups.map((g) => ({
            id: g.id,
            name: g.name,
            type: g.type,
            required: g.required,
            options: g.options.map((o) => ({
              id: o.id,
              name: o.name,
              priceDelta: o.priceDelta,
            })),
          })),
        })),
      })),
    })),
  };
}
