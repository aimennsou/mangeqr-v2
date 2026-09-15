"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ChefHat,
  Flame,
  Globe,
  Heart,
  Instagram,
  Leaf,
  MapPin,
  Phone,
  Plus,
  ShoppingBag,
  Star,
  Sun,
  Wifi,
  X,
  type LucideIcon,
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

  // Sticky-header tracking: keep `activeCategoryId` set to whichever category
  // section currently occupies the top of the viewport, so the sticky bar shows
  // the right title as the diner scrolls. Independent of impression tracking.
  useEffect(() => {
    const container = categoriesRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const visible = new Map<string, number>(); // categoryId -> top offset

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const id = el.dataset.categoryAnchor;
          if (!id) continue;
          if (entry.isIntersecting) {
            visible.set(id, entry.boundingClientRect.top);
          } else {
            visible.delete(id);
          }
        }
        if (visible.size === 0) return;
        // The active category is the visible one closest to the top.
        let topId: string | null = null;
        let topY = Infinity;
        visible.forEach((y, id) => {
          if (y < topY) {
            topY = y;
            topId = id;
          }
        });
        setActiveCategoryId(topId);
      },
      // A section counts as "at the top" once its body is near the sticky bars.
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );

    const sections = container.querySelectorAll<HTMLElement>(
      "[data-category-anchor]"
    );
    sections.forEach((s) => observer.observe(s));

    // Seed with the first category so the bar shows immediately.
    if (activeMenu?.categories?.length) {
      setActiveCategoryId(activeMenu.categories[0].id);
    }

    return () => observer.disconnect();
  }, [activeMenu?.id, activeMenu?.categories?.length]);

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
      // Decide the change from current state, fire the tracking side-effect
      // exactly once, THEN update state. Never call side-effects inside a state
      // updater — React (Strict Mode) may invoke the updater twice, which was
      // double-counting each favorite.
      setFavorited((prev) => {
        const isAdding = !prev.has(dishId);
        const next = new Set(prev);
        if (isAdding) next.add(dishId);
        else next.delete(dishId);
        return next;
      });
    },
    []
  );

  // Track a NEW favorite as a side-effect in the click handler (not the state
  // updater). Guarded so re-favoriting an already-favorited dish doesn't fire.
  const handleToggleFavorite = useCallback(
    (dishId: string) => {
      if (!favorited.has(dishId)) {
        track({ type: "favorite", restaurantId, dishId });
      }
      toggleFavorite(dishId);
    },
    [favorited, restaurantId, track, toggleFavorite]
  );

  // Sticky category nav: `activeCategoryId` is whichever category is currently
  // at the top of the viewport. The sticky bar shows ALL categories as chips so
  // the diner can jump to any of them (forward or back); the active one is
  // highlighted and auto-scrolled into view within the chip strip.
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const chipNavRef = useRef<HTMLDivElement | null>(null);

  // Scroll the given category's heading to just below the sticky bars.
  const scrollToCategory = useCallback((categoryId: string) => {
    const el = document.querySelector<HTMLElement>(
      `[data-category-anchor="${categoryId}"]`
    );
    if (!el) return;
    // Offset for the sticky top bar + the sticky category bar (~112px).
    const y = el.getBoundingClientRect().top + window.scrollY - 104;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  // Keep the active chip visible within the horizontal chip strip.
  useEffect(() => {
    if (!activeCategoryId) return;
    const nav = chipNavRef.current;
    const chip = nav?.querySelector<HTMLElement>(
      `[data-chip="${activeCategoryId}"]`
    );
    chip?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeCategoryId]);

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
      {/* Top bar: logo + centered active-menu title + language switcher.
          Mirrors the reference (logo square, centered "Plats" title). */}
      <header
        className="sticky top-0 z-20 flex items-center gap-2 px-4 py-3 backdrop-blur"
        style={{ backgroundColor: theme.background, borderColor: theme.border }}
      >
        <h1
          className="flex-1 truncate text-center text-lg font-bold"
          style={{ color: theme.text }}
        >
          {activeMenu?.name ?? name}
        </h1>
        {/* Language switcher (diner-controlled, independent of the owner app) */}
        <div
          className="flex shrink-0 gap-1 rounded-full p-0.5"
          style={{ backgroundColor: theme.surface }}
        >
          {LOCALES.map((l: Locale) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              aria-label={LOCALE_LABELS[l]}
              className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-colors"
              style={
                l === locale
                  ? { backgroundColor: theme.accent, color: theme.onAccent }
                  : { color: theme.muted }
              }
            >
              <span aria-hidden className="leading-none">
                {LOCALE_FLAGS[l]}
              </span>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Menu tabs as pills (the active one is a filled pill). */}
      {menus.length > 1 ? (
        <nav
          className="flex gap-2 overflow-x-auto px-4 pb-2 pt-1"
          style={{ backgroundColor: theme.background }}
        >
          {menus.map((menu) => {
            const isActive = menu.id === activeMenu?.id;
            return (
              <button
                key={menu.id}
                onClick={() => setActiveMenuId(menu.id)}
                className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
                style={
                  isActive
                    ? { backgroundColor: theme.accent, color: theme.onAccent }
                    : { color: theme.muted, backgroundColor: theme.surface }
                }
              >
                {menu.name}
              </button>
            );
          })}
        </nav>
      ) : null}

      {/* Cover with the restaurant name + address overlaid bottom-left. */}
      <header className="relative">
        <div
          className="relative mx-4 mt-2 h-40 overflow-hidden rounded-2xl"
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h2 className="text-2xl font-extrabold leading-tight text-white drop-shadow">
              {name}
            </h2>
            {show.showAddress && address ? (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-white/85">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {address}
              </p>
            ) : null}
          </div>
        </div>

        <div className="px-4 pt-3">
          {/* Contact chips (phone / wifi keep their value labels). */}
          {(show.showPhone && phone) || (show.showWifi && wifi) ? (
            <div className="flex flex-wrap gap-2">
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
        </div>
      </header>

      {/* "Suivez-nous" social row — a full-width light bar like the reference. */}
      {(show.showInstagram && instagram) ||
      (show.showTiktok && tiktok) ||
      (show.showWebsite && website) ||
      (show.showGoogle && google) ? (
        <div
          className="mx-4 mt-3 flex items-center justify-between rounded-xl px-4 py-2.5"
          style={{ backgroundColor: theme.surface }}
        >
          <span className="text-sm font-medium" style={{ color: theme.muted }}>
            {t("diner.followUs")}
          </span>
          <div className="flex items-center gap-4" style={{ color: theme.text }}>
            {show.showInstagram && instagram ? (
              <a
                href={`https://instagram.com/${instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("diner.instagram")}
                className="transition-opacity hover:opacity-70"
              >
                <Instagram className="h-5 w-5" />
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
                <FaTiktok className="h-4 w-4" />
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
                <Globe className="h-5 w-5" />
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
                <Star className="h-5 w-5" />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Sticky category nav: shows ALL categories as chips, pinned under the
          top bar. The category currently in view is highlighted; tap any chip
          to jump to that category's top (forward or back). */}
      {activeMenu && activeMenu.categories.length > 0 ? (
        <nav
          ref={chipNavRef}
          className="sticky top-[57px] z-10 flex gap-2 overflow-x-auto px-4 py-2.5 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            backgroundColor: theme.background,
            borderBottom: `1px solid ${theme.border}`,
          }}
          aria-label={t("diner.categories")}
        >
          {activeMenu.categories.map((category) => {
            const isActive = category.id === activeCategoryId;
            return (
              <button
                key={category.id}
                type="button"
                data-chip={category.id}
                onClick={() => scrollToCategory(category.id)}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                style={
                  isActive
                    ? { backgroundColor: theme.accent, color: theme.onAccent }
                    : { backgroundColor: theme.surface, color: theme.muted }
                }
              >
                {category.logo ? (
                  <span aria-hidden className="text-sm leading-none">
                    {category.logo}
                  </span>
                ) : null}
                {category.name}
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
              <section
                key={category.id}
                data-category-anchor={category.id}
                className="mt-8 scroll-mt-28 first:mt-6"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  {category.logo ? (
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg"
                      style={{ backgroundColor: theme.surface }}
                    >
                      {category.logo}
                    </span>
                  ) : null}
                  <h2
                    data-category-id={category.id}
                    className="text-lg font-bold tracking-tight"
                    style={styles.accent}
                  >
                    {category.name}
                  </h2>
                  <span
                    className="h-px flex-1"
                    style={{ backgroundColor: theme.border }}
                  />
                </div>
                <div className="space-y-3">
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
                        onToggleFavorite={() => handleToggleFavorite(dish.id)}
                        favoriteLabel={t("diner.favorite")}
                        orderingEnabled={orderingEnabled}
                        onAddToCart={() => openAddToCart(dish)}
                        addLabel={t("order.add")}
                        containsLabel={t("diner.contains")}
                        tagLabel={(k) => t(k as any)}
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

        {/* Powered by MangeQR — subtle attribution footer at the bottom of the
            diner menu (replaces the top logo). */}
        <footer className="mt-10 pb-6 pt-4 text-center">
          <a
            href="https://www.mangeqr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: theme.muted }}
          >
            <Image
              src="/android-chrome-192x192.png"
              alt="MangeQR"
              width={16}
              height={16}
              className="h-4 w-4 rounded"
            />
            {t("diner.poweredBy")}
          </a>
        </footer>
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

// Colors for the diet/quality tag badges (reference: green Végétarien, orange
// Fait maison). These are semantic accent chips independent of the owner theme.
const TAG_STYLES: Record<
  DietTag["variant"],
  { bg: string; fg: string; icon: LucideIcon }
> = {
  veg: { bg: "rgba(34,197,94,0.14)", fg: "#15803d", icon: Leaf },
  home: { bg: "rgba(249,115,22,0.14)", fg: "#c2410c", icon: ChefHat },
  spicy: { bg: "rgba(239,68,68,0.14)", fg: "#b91c1c", icon: Flame },
  season: { bg: "rgba(234,179,8,0.16)", fg: "#a16207", icon: Sun },
};

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
  containsLabel,
  tagLabel,
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
  containsLabel: string;
  tagLabel: (key: string) => string;
}) {
  const { tags, contains } = splitAllergenes(dish.allergenes);

  // Card layout mirrors the reference: white rounded card, left thumbnail,
  // name + right-aligned price, description, diet-tag badges, a "Contient :"
  // allergen row, and a heart + count (with an add button when ordering is on).
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
      className="w-full cursor-pointer rounded-2xl border p-3.5 text-left shadow-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surface,
        // @ts-expect-error CSS custom prop for tailwind ring color.
        "--tw-ring-color": theme.accent,
      }}
    >
      <div className="flex gap-3.5">
        {dish.photo ? (
          <div
            className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl"
            style={{ backgroundColor: theme.background }}
          >
            <Image
              src={dish.photo}
              alt={dish.name}
              fill
              className="object-cover"
              sizes="72px"
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Name + price */}
          <div className="flex items-start justify-between gap-3">
            <h3
              className="text-[15px] font-semibold leading-snug"
              style={{ color: theme.text }}
            >
              {dish.name}
            </h3>
            <span
              className="whitespace-nowrap text-[15px] font-bold tabular-nums"
              style={{ color: theme.text }}
            >
              {formatPrice(dish.price)} {currency}
            </span>
          </div>

          {dish.description ? (
            <p
              className="mt-1 line-clamp-2 text-[13px] leading-relaxed"
              style={{ color: theme.muted }}
            >
              {dish.description}
            </p>
          ) : null}

          {/* Diet / quality tag badges */}
          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag, i) => {
                const s = TAG_STYLES[tag.variant];
                const TagIcon = s.icon;
                return (
                  <span
                    key={`${tag.key}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: s.bg, color: s.fg }}
                  >
                    <TagIcon className="h-3 w-3" aria-hidden />
                    {tagLabel(tag.key)}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* "Contient :" allergen chips */}
      {contains.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs" style={{ color: theme.muted }}>
            {containsLabel} :
          </span>
          {contains.map((a) => (
            <span
              key={a}
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
              style={{ borderColor: theme.border, color: theme.muted }}
            >
              {a}
            </span>
          ))}
        </div>
      ) : null}

      {/* Heart + count (bottom-left) and add-to-cart (bottom-right). */}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          aria-label={favoriteLabel}
          aria-pressed={isFavorite}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="flex items-center gap-1.5 rounded-full px-1 py-1 transition-colors hover:bg-black/5"
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-neutral-400"
            )}
          />
          <span className="text-xs tabular-nums" style={{ color: theme.muted }}>
            {(dish.favoriteCount ?? 0) + (isFavorite ? 1 : 0)}
          </span>
        </button>

        {orderingEnabled ? (
          <button
            type="button"
            aria-label={addLabel}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: theme.accent, color: theme.onAccent }}
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
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

/**
 * Diet/quality "tags" (rendered as colored badges) vs true allergens (rendered
 * under "Contient :"). The owner stores everything in one `allergenes[]` array,
 * so we classify known dietary/quality values as tags and treat the rest as
 * allergens — matching the reference card (Végétarien/Fait maison badges +
 * "Contient : Gluten, Sulfites").
 */
type DietTag = {
  key: string;
  variant: "veg" | "home" | "spicy" | "season";
};

// Normalized lookup: known values (FR + EN spellings) → a tag descriptor.
const DIET_TAG_MAP: Record<string, DietTag> = {
  vegetarian: { key: "diner.tag.vegetarian", variant: "veg" },
  végétarien: { key: "diner.tag.vegetarian", variant: "veg" },
  vegetarien: { key: "diner.tag.vegetarian", variant: "veg" },
  "fait maison": { key: "diner.tag.homemade", variant: "home" },
  homemade: { key: "diner.tag.homemade", variant: "home" },
  piquant: { key: "diner.tag.spicy", variant: "spicy" },
  épicé: { key: "diner.tag.spicy", variant: "spicy" },
  spicy: { key: "diner.tag.spicy", variant: "spicy" },
  "de saison": { key: "diner.tag.seasonal", variant: "season" },
  seasonal: { key: "diner.tag.seasonal", variant: "season" },
};

function splitAllergenes(allergenes: string[]): {
  tags: DietTag[];
  contains: string[];
} {
  const tags: DietTag[] = [];
  const contains: string[] = [];
  for (const raw of allergenes) {
    const tag = DIET_TAG_MAP[raw.trim().toLowerCase()];
    if (tag) tags.push(tag);
    else contains.push(raw);
  }
  return { tags, contains };
}
