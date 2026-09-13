"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Globe,
  Heart,
  Instagram,
  MapPin,
  Phone,
  Plus,
  ShoppingBag,
  Star,
  Wifi,
  X,
} from "lucide-react";
import { AddToCartDialog } from "./ordering/AddToCartDialog";
import { CartSheet } from "./ordering/CartSheet";
import type { AddonGroup, CartLine, DinerTable, OrderableDish } from "./ordering/types";
import { lineTotal } from "./ordering/types";
import { FaTiktok } from "react-icons/fa6";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ReviewWidget } from "./ReviewWidget";
import { useI18n } from "@/lib/i18n";
import { LOCALES, LOCALE_LABELS, LOCALE_FLAGS, type Locale } from "@/lib/i18n/config";
import type { MenuAppearance } from "@/schemas";
import {
  appearanceStyles,
  appearanceTheme,
  withAppearanceDefaults,
  type AppearanceTheme,
} from "@/lib/menu-appearance";

type Dish = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo: string | null;
  allergenes: string[];
  /** Total times this dish was favorited (heart), shown next to the heart. */
  favoriteCount?: number;
  /** Add-on groups for the diner order builder (FEAT-1/D12). */
  addonGroups?: AddonGroup[];
};

type Category = {
  id: string;
  name: string;
  logo: string | null;
  dishes: Dish[];
};

type Menu = {
  id: string;
  name: string;
  categories: Category[];
};

export interface PublicMenuProps {
  restaurantId: string;
  name: string;
  address: string;
  phone: string;
  coverUrl: string | null;
  wifi?: string | null;
  website?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  google?: string | null;
  currency: string;
  menus: Menu[];
  menuAppearance?: MenuAppearance | null;
  /** FEAT-1: diner ordering context (from getPublicMenuData). */
  orderingEnabled?: boolean;
  tables?: DinerTable[];
  /**
   * When true (owner-facing live preview), skip the fire-and-forget scan
   * tracking POST so opening/switching the editor never inflates the owner's
   * own analytics. Defaults to false so the real diner route is unaffected.
   */
  previewMode?: boolean;
  /**
   * Preview only: the fixed-size phone SCREEN element to portal the dish dialog
   * into, so the dialog is contained to the visible phone viewport instead of
   * escaping to the app (document.body) or spanning the tall scrolling menu.
   */
  previewContainer?: HTMLElement | null;
}

export function PublicMenu({
  restaurantId,
  name,
  address,
  phone,
  coverUrl,
  wifi,
  website,
  instagram,
  tiktok,
  google,
  currency,
  menus,
  menuAppearance,
  orderingEnabled = false,
  tables = [],
  previewMode = false,
  previewContainer,
}: PublicMenuProps) {
  const [activeMenuId, setActiveMenuId] = useState<string>(
    menus[0]?.id ?? ""
  );
  const { t, locale, setLocale } = useI18n();
  const scanTracked = useRef(false);

  // Root element of this menu. In preview mode the dish dialog is portaled into
  // the phone SCREEN (previewContainer) — or this root as a fallback — instead
  // of document.body, so it stays inside the phone frame rather than opening as
  // a full-app overlay (BUG: preview dish popup opened in the app).
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [dialogContainer, setDialogContainer] = useState<HTMLElement | null>(
    null
  );
  useEffect(() => {
    if (previewMode) setDialogContainer(previewContainer ?? rootRef.current);
  }, [previewMode, previewContainer]);

  // Dish currently opened in the detail view (null = closed).
  const [openDish, setOpenDish] = useState<Dish | null>(null);

  // FEAT-1 ordering: cart lines + the add-to-cart dialog target + cart sheet.
  const [cart, setCart] = useState<CartLine[]>([]);
  const [addDish, setAddDish] = useState<OrderableDish | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + lineTotal(l), 0);

  const addToCart = useCallback((line: CartLine) => {
    setCart((prev) => [...prev, line]);
  }, []);
  const changeQty = useCallback((lineId: string, qty: number) => {
    setCart((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l))
    );
  }, []);
  const removeLine = useCallback((lineId: string) => {
    setCart((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);
  const clearCart = useCallback(() => setCart([]), []);

  // Open the add-to-cart dialog for a dish (maps to the OrderableDish shape).
  const openAddToCart = useCallback((dish: Dish) => {
    setAddDish({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      photo: dish.photo,
      allergenes: dish.allergenes,
      addonGroups: dish.addonGroups ?? [],
    });
  }, []);

  // Container wrapping the rendered category sections — used to (re)observe the
  // category headings for impression tracking.
  const categoriesRef = useRef<HTMLDivElement | null>(null);
  // categoryIds already counted this session, so re-scroll / menu-switch never
  // double-counts the same category impression (Req P1 de-dupe).
  const categoryTracked = useRef<Set<string>>(new Set());

  /**
   * Fire a best-effort tracking event. No-ops in owner preview so the owner's
   * own browsing never inflates analytics (same guard as scan tracking).
   */
  const track = useCallback(
    (body: Record<string, unknown>) => {
      if (previewMode) return;
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {
        /* analytics is best-effort */
      });
    },
    [previewMode]
  );

  // Record a scan once per page load (fire-and-forget; never blocks the UI).
  useEffect(() => {
    if (scanTracked.current) return;
    scanTracked.current = true;
    track({ type: "scan", restaurantId });
  }, [restaurantId, track]);

  const activeMenu = menus.find((m) => m.id === activeMenuId) ?? menus[0];

  // P1 — Category impression tracking. Observe every rendered category heading;
  // the first time a category scrolls meaningfully into view (threshold 0.5) we
  // POST { type:'category', categoryId } once, deduped per categoryId for the
  // whole session via `categoryTracked`. Re-runs when the active menu changes so
  // categories rendered by a newly selected menu tab get observed too.
  useEffect(() => {
    if (previewMode) return;
    const container = categoriesRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const categoryId = el.dataset.categoryId;
          if (!categoryId || categoryTracked.current.has(categoryId)) continue;
          categoryTracked.current.add(categoryId);
          track({ type: "category", restaurantId, categoryId });
          // Once counted, stop watching this heading.
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    const sections = container.querySelectorAll<HTMLElement>(
      "[data-category-id]"
    );
    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, [restaurantId, previewMode, track, activeMenu?.id]);

  const openDishDetail = useCallback(
    (dish: Dish) => {
      setOpenDish(dish);
      // Count EACH open (per spec: dish opens count each open).
      track({ type: "dish", restaurantId, dishId: dish.id });
    },
    [restaurantId, track]
  );

  // Dishes the diner has favorited this session (heart filled). Each NEW
  // favorite fires a tracking event that feeds the "Le plat favoris" KPI.
  const [favorited, setFavorited] = useState<Set<string>>(new Set());
  const toggleFavorite = useCallback(
    (dishId: string) => {
      setFavorited((prev) => {
        const next = new Set(prev);
        if (next.has(dishId)) {
          next.delete(dishId);
        } else {
          next.add(dishId);
          // Only count adding to favorites (not un-favoriting).
          track({ type: "favorite", restaurantId, dishId });
        }
        return next;
      });
    },
    [restaurantId, track]
  );

  // Effective appearance: stored settings merged over the shared defaults, so
  // the diner menu applies the SAME field→style mapping the editor preview uses
  // (D.4). When `menuAppearance` is unset, this yields the default look
  // (white bg, Inter, dark #111827 accent, all info rows shown) — Req 4.4.
  const show = withAppearanceDefaults(menuAppearance);
  const styles = appearanceStyles(menuAppearance);
  // Full self-consistent palette derived from the owner's colors (BUG-7). The
  // diner menu skins EVERY surface from this instead of app theme tokens, so it
  // renders identically regardless of the diner's device dark/light theme.
  const theme = appearanceTheme(menuAppearance);

  return (
    <div
      ref={rootRef}
      className={cn("mx-auto min-h-screen max-w-lg pb-16", previewMode && "relative")}
      style={{ ...styles.screen, color: theme.text }}
    >
      {/* Cover / header */}
      <header className="relative">
        <div
          className="relative h-44 w-full"
          style={{ backgroundColor: theme.surface }}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        {/* Language switcher (diner-controlled, independent of the owner app) */}
        <div className="absolute right-3 top-3 flex gap-1 rounded-full bg-black/40 p-1 backdrop-blur">
          {LOCALES.map((l: Locale) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              aria-label={LOCALE_LABELS[l]}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                l === locale
                  ? "bg-white text-black"
                  : "text-white/80 hover:text-white"
              )}
            >
              <span aria-hidden className="leading-none">
                {LOCALE_FLAGS[l]}
              </span>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="px-4 pt-3">
          <h1 className="text-2xl font-bold" style={styles.accent}>
            {name}
          </h1>
          {show.showAddress && address ? (
            <div
              className="mt-1 flex items-center gap-1.5 text-sm"
              style={{ color: theme.muted }}
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{address}</span>
            </div>
          ) : null}

          {/* Contact chips (phone / wifi keep their value labels). */}
          {(show.showPhone && phone) || (show.showWifi && wifi) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {show.showPhone && phone ? (
                <a href={`tel:${phone}`}>
                  <Chip icon={<Phone className="h-3.5 w-3.5" />} label={phone} theme={theme} />
                </a>
              ) : null}
              {show.showWifi && wifi ? (
                <Chip icon={<Wifi className="h-3.5 w-3.5" />} label={`${t("diner.wifi")}: ${wifi}`} theme={theme} />
              ) : null}
            </div>
          ) : null}

          {/* Socials as a compact "Suivez-nous" icon row (like the reference). */}
          {(show.showInstagram && instagram) ||
          (show.showTiktok && tiktok) ||
          (show.showWebsite && website) ||
          (show.showGoogle && google) ? (
            <div
              className="mt-3 flex items-center gap-3"
              style={{ color: theme.muted }}
            >
              <span className="text-xs font-medium">{t("diner.followUs")}</span>
              {show.showInstagram && instagram ? (
                <a
                  href={`https://instagram.com/${instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("diner.instagram")}
                  className="transition-opacity hover:opacity-70"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              ) : null}
              {show.showTiktok && tiktok ? (
                <a
                  href={`https://tiktok.com/@${tiktok.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("diner.tiktok")}
                  className="transition-opacity hover:opacity-70"
                >
                  <FaTiktok className="h-3.5 w-3.5" />
                </a>
              ) : null}
              {show.showWebsite && website ? (
                <a
                  href={ensureHttp(website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("diner.website")}
                  className="transition-opacity hover:opacity-70"
                >
                  <Globe className="h-4 w-4" />
                </a>
              ) : null}
              {show.showGoogle && google ? (
                <a
                  href={ensureHttp(google)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("diner.googleReviews")}
                  className="transition-opacity hover:opacity-70"
                >
                  <Star className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {/* Menu tabs (only when more than one menu) */}
      {menus.length > 1 ? (
        <nav
          className="sticky top-0 z-10 mt-4 flex gap-2 overflow-x-auto border-b px-4 py-2 backdrop-blur"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          {menus.map((menu) => {
            const isActive = menu.id === activeMenu?.id;
            return (
              <button
                key={menu.id}
                onClick={() => setActiveMenuId(menu.id)}
                className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                style={
                  isActive
                    ? { backgroundColor: theme.accent, color: theme.onAccent }
                    : { color: theme.muted }
                }
              >
                {menu.name}
              </button>
            );
          })}
        </nav>
      ) : null}

      {/* Menu content */}
      <main className="px-4">
        {menus.length === 0 ? (
          <p className="py-16 text-center" style={{ color: theme.muted }}>
            {t("diner.noMenuToday")}
          </p>
        ) : !activeMenu || activeMenu.categories.length === 0 ? (
          <p className="py-16 text-center" style={{ color: theme.muted }}>
            {t("diner.comingSoon")}
          </p>
        ) : (
          <div ref={categoriesRef}>
            {activeMenu.categories.map((category) => (
              <section key={category.id} className="mt-6">
                <h2
                  data-category-id={category.id}
                  className="flex items-center gap-2 text-lg font-semibold"
                  style={styles.accent}
                >
                  {category.logo ? <span>{category.logo}</span> : null}
                  {category.name}
                </h2>
                <div className="mt-3 space-y-3">
                  {category.dishes.length === 0 ? (
                    <p className="text-sm" style={{ color: theme.muted }}>
                      {t("diner.emptyCategory")}
                    </p>
                  ) : (
                    category.dishes.map((dish) => (
                      <DishRow
                        key={dish.id}
                        dish={dish}
                        currency={currency}
                        accent={styles.accent}
                        theme={theme}
                        onOpen={() => openDishDetail(dish)}
                        isFavorite={favorited.has(dish.id)}
                        onToggleFavorite={() => toggleFavorite(dish.id)}
                        favoriteLabel={t("diner.favorite")}
                        orderingEnabled={orderingEnabled}
                        onAddToCart={() => openAddToCart(dish)}
                        addLabel={t("order.add")}
                      />
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Review widget */}
        <section className="mt-8">
          <ReviewWidget restaurantId={restaurantId} googleLink={google} theme={theme} />
        </section>
      </main>

      {/* P2 — Dish detail view. Themed from the owner's appearance (not app
          tokens) so it stays readable and on-brand. Tracking fires on open in
          `openDishDetail`, so this only handles presentation + close. */}
      <DishDetailDialog
        dish={openDish}
        theme={theme}
        accent={styles.accent}
        closeLabel={t("diner.close")}
        previewMode={previewMode}
        container={dialogContainer}
        onOpenChange={(open) => {
          if (!open) setOpenDish(null);
        }}
      />

      {/* FEAT-1 ordering: add-to-cart dialog + floating cart button + cart sheet.
          All gated behind orderingEnabled so non-ordering menus are unaffected. */}
      {orderingEnabled ? (
        <>
          <AddToCartDialog
            dish={addDish}
            currency={currency}
            theme={theme}
            accent={styles.accent}
            previewMode={previewMode}
            container={dialogContainer}
            labels={{
              addToCart: t("order.add"),
              quantity: t("order.quantity"),
              specialRequest: t("order.specialRequest"),
              specialRequestPlaceholder: t("order.specialRequestPlaceholder"),
              required: t("order.required"),
              close: t("diner.close"),
            }}
            onOpenChange={(open) => {
              if (!open) setAddDish(null);
            }}
            onAdd={addToCart}
          />

          {cartCount > 0 ? (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className={cn(
                "z-40 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition-transform hover:scale-105",
                previewMode ? "absolute bottom-4 right-4" : "fixed bottom-5 right-5"
              )}
              style={{ backgroundColor: theme.accent, color: theme.onAccent }}
            >
              <ShoppingBag className="h-5 w-5" />
              <span>{cartCount}</span>
              <span className="tabular-nums">
                {Number.isInteger(cartTotal)
                  ? cartTotal.toString()
                  : cartTotal.toFixed(2)}{" "}
                {currency}
              </span>
            </button>
          ) : null}

          <CartSheet
            open={cartOpen}
            onOpenChange={setCartOpen}
            restaurantId={restaurantId}
            currency={currency}
            tables={tables}
            lines={cart}
            theme={theme}
            accent={styles.accent}
            previewMode={previewMode}
            container={dialogContainer}
            labels={{
              title: t("order.cartTitle"),
              empty: t("order.cartEmpty"),
              dineIn: t("order.dineIn"),
              delivery: t("order.delivery"),
              chooseTable: t("order.chooseTable"),
              name: t("order.name"),
              phone: t("order.phone"),
              address: t("order.address"),
              shareLocation: t("order.shareLocation"),
              locationShared: t("order.locationShared"),
              note: t("order.note"),
              notePlaceholder: t("order.notePlaceholder"),
              total: t("order.total"),
              submit: t("order.submit"),
              submitting: t("order.submitting"),
              close: t("diner.close"),
              successTitle: t("order.successTitle"),
            }}
            onChangeQty={changeQty}
            onRemove={removeLine}
            onClear={clearCart}
          />
        </>
      ) : null}
    </div>
  );
}

function DishRow({
  dish,
  currency,
  accent,
  theme,
  onOpen,
  isFavorite,
  onToggleFavorite,
  favoriteLabel,
  orderingEnabled,
  onAddToCart,
  addLabel,
}: {
  dish: Dish;
  currency: string;
  accent: { color: string };
  theme: AppearanceTheme;
  onOpen: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  favoriteLabel: string;
  orderingEnabled: boolean;
  onAddToCart: () => void;
  addLabel: string;
}) {
  // The row opens the dish detail. It's a role="button" div (not a <button>)
  // so it can safely contain the favorite <button> without nesting buttons.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex w-full cursor-pointer gap-3 rounded-lg border p-3 text-left transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surface,
        // Keep the focus ring visible + on-brand over any themed surface.
        // @ts-expect-error CSS custom prop for tailwind ring color.
        "--tw-ring-color": theme.accent,
      }}
    >
      {dish.photo ? (
        <div
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md"
          style={{ backgroundColor: theme.surface }}
        >
          <Image
            src={dish.photo}
            alt={dish.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium" style={{ color: theme.text }}>
            {dish.name}
          </h3>
          <span
            className="whitespace-nowrap font-semibold"
            style={accent}
          >
            {formatPrice(dish.price)} {currency}
          </span>
        </div>
        {dish.description ? (
          <p className="mt-0.5 line-clamp-2 text-sm" style={{ color: theme.muted }}>
            {dish.description}
          </p>
        ) : null}
        <div className="mt-2 flex items-end justify-between gap-2">
          {dish.allergenes.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {dish.allergenes.map((a) => (
                <Badge
                  key={a}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: theme.surface,
                    color: theme.muted,
                    borderColor: theme.border,
                  }}
                >
                  {a}
                </Badge>
              ))}
            </div>
          ) : (
            <span />
          )}

          {/* Favorite (heart) button + running count — stops propagation so it
              doesn't open the dish detail. Filled/red when favorited. The count
              shows the DB total plus this diner's optimistic +1 when favorited. */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={favoriteLabel}
              aria-pressed={isFavorite}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-black/5"
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  isFavorite ? "fill-red-500 text-red-500" : "text-neutral-400"
                )}
              />
              <span
                className="text-xs tabular-nums"
                style={{ color: theme.muted }}
              >
                {(dish.favoriteCount ?? 0) + (isFavorite ? 1 : 0)}
              </span>
            </button>

            {/* Add-to-cart (FEAT-1) — only when ordering is enabled. */}
            {orderingEnabled ? (
              <button
                type="button"
                aria-label={addLabel}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.accent, color: theme.onAccent }}
              >
                <Plus className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dish detail dialog — shows the dish larger (big photo, name in accent, full
 * description, price, allergen chips). Surface is skinned from `theme` so it
 * matches the owner's appearance and reads correctly on any device theme.
 */
function DishDetailDialog({
  dish,
  theme,
  accent,
  closeLabel,
  previewMode = false,
  container,
  onOpenChange,
}: {
  dish: Dish | null;
  theme: AppearanceTheme;
  accent: { color: string };
  closeLabel: string;
  /** Owner preview: contain the dialog inside the phone frame instead of the app. */
  previewMode?: boolean;
  /** Portal target (the menu root) when in preview mode. */
  container?: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
}) {
  // In preview mode we render the overlay/content with ABSOLUTE positioning and
  // portal into the phone container, so the dialog stays inside the phone frame
  // rather than covering the whole app (fixed = viewport). On the real diner
  // route it stays fixed + portaled to <body> as usual.
  const positionClass = previewMode ? "absolute" : "fixed";
  return (
    <Dialog open={dish !== null} onOpenChange={onOpenChange}>
      {dish ? (
        <DialogPortal container={previewMode ? container ?? undefined : undefined}>
          <DialogOverlay className={cn(previewMode && "absolute")} />
          <DialogPrimitive.Content
            className={cn(
              positionClass,
              "left-[50%] top-[50%] z-50 grid max-h-[90vh] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto rounded-2xl border p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
            style={{
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.text,
            }}
          >
            {/* Photo-focused view: the dialog exists to show the dish photo
                LARGER. Name/description/price/allergens are already visible in
                the summary row, so we don't repeat them — only the dish name is
                kept as a small caption overlay for context (and a11y title). */}
            {dish.photo ? (
              <div
                className="relative aspect-[3/4] max-h-[80vh] w-full overflow-hidden"
                style={{ backgroundColor: theme.surface }}
              >
                <Image
                  src={dish.photo}
                  alt={dish.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 448px) 100vw, 448px"
                  priority
                />
                {/* Name caption over a subtle gradient for readability. */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                  <DialogPrimitive.Title className="text-lg font-bold leading-tight text-white">
                    {dish.name}
                  </DialogPrimitive.Title>
                </div>
                <DialogPrimitive.Description className="sr-only">
                  {dish.name}
                </DialogPrimitive.Description>
              </div>
            ) : (
              // No photo: nothing new to show beyond the summary, so keep a
              // minimal card with just the name.
              <div className="flex flex-col gap-1 px-5 py-8 text-center">
                <DialogPrimitive.Title
                  className="text-xl font-bold leading-tight"
                  style={accent}
                >
                  {dish.name}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  {dish.name}
                </DialogPrimitive.Description>
              </div>
            )}

            <DialogPrimitive.Close
              aria-label={closeLabel}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full opacity-90 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                // @ts-expect-error CSS custom prop for tailwind ring color.
                "--tw-ring-color": theme.accent,
              }}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      ) : null}
    </Dialog>
  );
}

function Chip({
  icon,
  label,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  theme: AppearanceTheme;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      {icon}
      {label}
    </span>
  );
}

function formatPrice(price: number) {
  return Number.isInteger(price) ? price.toString() : price.toFixed(2);
}

function ensureHttp(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
