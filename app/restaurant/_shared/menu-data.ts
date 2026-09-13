import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getS3Url } from "@/lib/s3";
import type { MenuAppearance } from "@/schemas";
import { currencySymbol } from "@/lib/currency";

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
              },
            },
          },
        },
      },
    },
  });

  if (!restaurant) return null;

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
    coverUrl: restaurant.coverPhoto ? getS3Url(restaurant.coverPhoto) || null : null,
    wifi: restaurant.wifi,
    website: restaurant.website,
    instagram: restaurant.instagram,
    tiktok: restaurant.tiktok,
    google: restaurant.google,
    // Saved per-restaurant appearance (D.1 JSON column). Passed through as-is
    // (null when unset); PublicMenu normalizes it against the shared defaults.
    menuAppearance: (restaurant.menuAppearance as MenuAppearance | null) ?? null,
    currency: currencySymbol(restaurant.currency),
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
          photo: dish.photo ? getS3Url(dish.photo) || null : null,
          allergenes: dish.allergenes,
          favoriteCount: favoriteCountByDish.get(dish.id) ?? 0,
        })),
      })),
    })),
  };
}
