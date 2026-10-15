'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import {
  ArrowLeft,
  Check,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
  UtensilsCrossed,
  Loader2,
} from 'lucide-react';

import { resolveBorneConfig, type BorneConfig } from '@/schemas';
import { cn } from '@/lib/utils';
import { I18nProvider, useI18n } from '@/lib/i18n';
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_FLAGS,
  type Locale,
} from '@/lib/i18n/config';
import type {
  AddonGroup,
  CartLine,
  DinerTable,
  OrderableDish,
} from '@/app/restaurant/[id]/_components/ordering/types';
import { lineTotal } from '@/app/restaurant/[id]/_components/ordering/types';

// ---- Data shapes (from getPublicMenuData) ----------------------------------

type Dish = OrderableDish;
interface Category {
  id: string;
  name: string;
  logo: string | null;
  dishes: Dish[];
}
interface Menu {
  id: string;
  name: string;
  categories: Category[];
}

export interface BorneKioskProps {
  restaurantId: string;
  name: string;
  currency: string;
  /** Restaurant cover photo, used as a big blurred backdrop on the intro screens. */
  coverUrl?: string | null;
  menus: Menu[];
  tables: DinerTable[];
  borneConfig: BorneConfig | null;
}

type Screen = 'welcome' | 'type' | 'menu' | 'cart' | 'payment' | 'done';

// The kiosk step sequence shown in the top stepper. The final node is the
// payment/confirmation (card icon). `current` is the 1-based active step.
const KIOSK_STEP_COUNT = 4; // numbered steps before the card node

/**
 * Kiosk language picker: big flag pills sized for a touch screen.
 *
 * The kiosk faces walk-in customers who never signed in, so it needs its own
 * switcher — without one the whole flow was French-only. `stopPropagation` is
 * required on the welcome screen, where the entire viewport is a "tap to start"
 * button and a bare click would advance the screen instead of switching locale.
 */
function KioskLangSwitcher({
  onDark = false,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t('kiosk.language')}
      className={cn('flex items-center gap-2', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {LOCALES.map((l: Locale) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            aria-label={LOCALE_LABELS[l]}
            aria-pressed={active}
            onClick={(e) => {
              e.stopPropagation();
              setLocale(l);
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-2 text-base font-semibold transition-colors',
              active
                ? 'bg-white text-neutral-900 shadow'
                : onDark
                  ? 'bg-white/10 text-white/70'
                  : 'bg-black/5 text-neutral-500'
            )}
          >
            <span aria-hidden className="text-lg leading-none">
              {LOCALE_FLAGS[l]}
            </span>
            <span className="uppercase">{l}</span>
          </button>
        );
      })}
    </div>
  );
}

function KioskSteps({
  current,
  title,
  subtitle,
  accent,
  onDark = false,
}: {
  current: number;
  title: string;
  /** Optional: an empty string renders no subtitle line rather than a blank gap. */
  subtitle?: string;
  accent: string;
  /**
   * True when this bar sits over a dark cover backdrop.
   *
   * The bar is a translucent blurred surface rather than a solid fill, so it
   * picks up whatever is behind it — the restaurant's cover photo on the intro
   * screens, plain neutral elsewhere. It used to be an opaque `bg-white`, which
   * both cut a hard white band across the cover image and left the title
   * invisible: screens with a cover set `text-neutral-50` on their root, so white
   * type landed on a white bar.
   */
  onDark?: boolean;
}) {
  const numbered = [1, 2, 3, 4];
  const mutedLine = onDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)';
  return (
    <div
      className={cn(
        'border-b px-6 py-5 backdrop-blur-xl',
        onDark
          ? 'border-white/10 bg-black/25 text-neutral-50'
          : 'border-black/10 bg-white/75 text-neutral-900'
      )}
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center gap-2">
          {numbered.map((n, i) => {
            const done = n < current;
            const active = n === current;
            return (
              <div key={n} className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-colors',
                    done || active
                      ? 'text-white'
                      : onDark
                      ? 'text-white/50'
                      : 'text-neutral-400'
                  )}
                  style={
                    done || active
                      ? { backgroundColor: accent, color: '#000' }
                      : { border: `2px solid ${mutedLine}` }
                  }
                >
                  {done ? <Check className="h-5 w-5" /> : n}
                </span>
                <span
                  className="h-0.5 w-6 rounded-full"
                  style={{
                    backgroundColor: n < current ? accent : mutedLine,
                  }}
                />
              </div>
            );
          })}
          {/* Payment / confirmation node (card icon). */}
          <span
            className={cn(
              'flex h-10 w-12 shrink-0 items-center justify-center rounded-full transition-colors',
              current > KIOSK_STEP_COUNT
                ? ''
                : onDark
                ? 'text-white/50'
                : 'text-neutral-400'
            )}
            style={
              current > KIOSK_STEP_COUNT
                ? { backgroundColor: accent, color: '#000' }
                : { border: `2px solid ${mutedLine}` }
            }
          >
            <CreditCard className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-5 text-center">
          <h1
            className={cn(
              'text-3xl font-extrabold tracking-tight',
              onDark && 'drop-shadow-lg'
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className={cn(
                'mt-1 text-lg',
                onDark ? 'text-white/70' : 'text-neutral-400'
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Big blurred restaurant cover backdrop for the intro screens (welcome / order
 * type). Absolutely positioned behind the content with a dark scrim so text and
 * cards stay readable. Renders nothing when there's no cover photo.
 */
function CoverBackdrop({ coverUrl }: { coverUrl?: string | null }) {
  if (!coverUrl) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src={coverUrl}
        alt=""
        fill
        priority
        className="scale-110 object-cover blur-2xl"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-neutral-950/80" />
    </div>
  );
}

/**
 * Public entry point for the kiosk.
 *
 * Wraps the flow in an ISOLATED I18nProvider (the same mechanism the owner's
 * menu preview uses). Two reasons:
 *
 * 1. The kiosk runs unattended on in-store hardware. With the shared provider,
 *    a walk-in switching to Arabic wrote `mangeqr_locale` to the cookie and
 *    localStorage, so the kiosk's "home" language silently drifted to whatever
 *    the last customer picked and survived a reload.
 * 2. It lets `reset()` restore the restaurant's own language between customers
 *    without touching anything global.
 *
 * `initialLocale` is seeded from the outer app locale, which the root layout
 * resolved from the cookie server-side — passing it through avoids a hydration
 * mismatch that `readInitialLocale` would cause on its own (it returns the
 * default on the server and the cookie value on the client).
 *
 * An isolated provider deliberately does NOT touch `document.documentElement`,
 * so `KioskLocaleFrame` carries `lang`/`dir` itself. `display: contents` keeps
 * it out of the layout while still being the nearest `[dir]` ancestor, which is
 * all Tailwind's `rtl:` variant needs.
 */
export function BorneKiosk(props: BorneKioskProps) {
  const { locale: appLocale } = useI18n();

  return (
    <I18nProvider isolated initialLocale={appLocale}>
      <KioskLocaleFrame>
        <BorneKioskInner {...props} homeLocale={appLocale} />
      </KioskLocaleFrame>
    </I18nProvider>
  );
}

function KioskLocaleFrame({ children }: { children: React.ReactNode }) {
  const { locale, dir } = useI18n();
  return (
    <div lang={locale} dir={dir} className="contents">
      {children}
    </div>
  );
}

/**
 * Full-screen self-order kiosk (borne de commande), modeled on a typical QSR
 * kiosk flow: welcome → order type → photo menu (category rail + dish grid,
 * item detail with add-ons, persistent cart bar) → cart review → confirmation
 * with an order number. Reuses the diner CartLine shape and the shared
 * POST /api/orders submit contract.
 */
function BorneKioskInner({
  restaurantId,
  name,
  currency,
  coverUrl,
  menus,
  tables,
  borneConfig,
  homeLocale,
}: BorneKioskProps & { homeLocale: Locale }) {
  const { t, setLocale } = useI18n();
  const cfg = resolveBorneConfig(borneConfig);
  const accent = cfg.accent;

  // Kiosk shows EVERYTHING available today: flatten all categories from every
  // available menu into one list (no menu switcher). Categories are deduped by
  // id and kept in menu → position order.
  const allCategories = useMemo(() => {
    const seen = new Set<string>();
    const out: Category[] = [];
    for (const m of menus) {
      for (const c of m.categories) {
        if (c.dishes.length === 0) continue;
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        out.push(c);
      }
    }
    return out;
  }, [menus]);

  const [screen, setScreen] = useState<Screen>('welcome');
  // Kiosk service mode is on-site only: table service or counter pickup. Both
  // submit as a DINE_IN order (no home delivery from a kiosk); "table" carries
  // a tableId, "counter" doesn't.
  const [serviceMode, setServiceMode] = useState<'table' | 'counter'>('table');
  // On the service step, whether a mode was picked (reveals the table picker).
  const [typeChosen, setTypeChosen] = useState(false);
  const [tableId, setTableId] = useState('');
  const [lines, setLines] = useState<CartLine[]>([]);
  // The category currently in view (scrollspy), used to highlight the rail.
  const [activeCatId, setActiveCatId] = useState<string>(
    allCategories[0]?.id ?? ''
  );
  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    id: string;
    number: number | null;
  } | null>(null);
  const [rating, setRating] = useState(0);

  // Scroll container + per-category section refs for scrollspy + click-to-scroll.
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const railRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Scrollspy: highlight the category whose section is nearest the top of the
  // scroll area, and keep the active rail item in view.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || allCategories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting section.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target.getAttribute('data-cat-id');
        if (id) setActiveCatId(id);
      },
      { root, rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );
    for (const c of allCategories) {
      const el = sectionRefs.current[c.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [allCategories, screen]);

  // Keep the highlighted rail button scrolled into view.
  useEffect(() => {
    railRefs.current[activeCatId]?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [activeCatId]);

  const scrollToCategory = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const fmt = (n: number) =>
    (Number.isInteger(n) ? n.toString() : n.toFixed(2)) + ' ' + currency;
  const cartCount = lines.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = lines.reduce((s, l) => s + lineTotal(l), 0);

  // Upsell suggestions for the cart: dishes not already in the cart, cheapest
  // first (typical add-ons: sides, drinks, desserts), capped at a small set.
  const suggestions = useMemo(() => {
    const inCart = new Set(lines.map((l) => l.dishId));
    const all: Dish[] = [];
    const seen = new Set<string>();
    for (const c of allCategories) {
      for (const d of c.dishes) {
        if (inCart.has(d.id) || seen.has(d.id)) continue;
        seen.add(d.id);
        all.push(d);
      }
    }
    return all.sort((a, b) => a.price - b.price).slice(0, 6);
  }, [allCategories, lines]);

  const addLine = (line: CartLine) => setLines((prev) => [...prev, line]);
  const changeQty = (lineId: string, qty: number) =>
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l))
    );
  const removeLine = (lineId: string) =>
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));

  const reset = () => {
    setLines([]);
    setServiceMode('table');
    setTypeChosen(false);
    setTableId('');
    setNote('');
    setSubmitError(null);
    setDetailDish(null);
    setConfirmation(null);
    setRating(0);
    // Back to the restaurant's own language, so the next walk-in doesn't inherit
    // the previous customer's choice. Safe to call unconditionally: the kiosk's
    // provider is isolated, so this writes no cookie and no localStorage.
    setLocale(homeLocale);
    setScreen('welcome');
  };

  // Post an optional experience rating (best-effort) tied to the restaurant.
  const submitRating = (value: number) => {
    setRating(value);
    void fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        review: value,
        state: 'MANGEQR',
      }),
    }).catch(() => {});
  };

  // Submit the order (called from the payment step) then show confirmation.
  const submitOrder = async () => {
    if (lines.length === 0) return;
    setSubmitError(null);
    const payload = {
      restaurantId,
      // On-site kiosk order (dine-in). Counter pickup has no table.
      type: 'DINE_IN' as const,
      // Authorizes the order via the account's kiosk flag, so the kiosk keeps
      // working when menu ordering is disabled for the account/restaurant.
      source: 'KIOSK' as const,
      tableId: serviceMode === 'table' ? tableId || null : null,
      customerName: '',
      customerPhone: '',
      address: '',
      latitude: null,
      longitude: null,
      note: note.trim(),
      items: lines.map((l) => ({
        dishId: l.dishId,
        quantity: l.quantity,
        optionIds: l.options.map((o) => o.id),
        specialRequest: l.specialRequest,
      })),
    };
    try {
      setSubmitting(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        // `data.error` comes from the API and is French-only today; the
        // dictionary value is the fallback.
        setSubmitError(data?.error ?? t('kiosk.error.generic'));
        return;
      }
      setConfirmation({
        id: data.id,
        number: typeof data.orderNumber === 'number' ? data.orderNumber : null,
      });
      setScreen('done');
    } catch {
      setSubmitError(t('kiosk.error.network'));
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Welcome ------------------------------------------------------------
  if (screen === 'welcome') {
    return (
      <button
        type="button"
        onClick={() => setScreen('menu')}
        className="relative flex h-screen w-screen flex-col items-center justify-center gap-10 overflow-hidden bg-neutral-950 text-center text-neutral-50"
      >
        <CoverBackdrop coverUrl={coverUrl} />
        {/* NO language switcher on this screen, deliberately.
            The only text here is cfg.welcomeTitle / cfg.welcomeSubtitle, which
            the OWNER writes in the borne settings — owner-authored content is
            never translated. So a switcher here changed the locale but left the
            visible text alone, which reads as a broken control. The switcher
            appears from the next screen onward, where the copy is ours. */}
        <span
          className="relative z-10 flex h-32 w-32 items-center justify-center rounded-[2rem] shadow-2xl"
          style={{ backgroundColor: accent, color: '#000' }}
        >
          <UtensilsCrossed className="h-16 w-16" />
        </span>
        <div className="relative z-10">
          <h1 className="font-serif-display text-7xl font-light tracking-tight drop-shadow-lg">
            {cfg.welcomeTitle}
          </h1>
          <p className="mt-5 text-3xl text-white/70">{cfg.welcomeSubtitle}</p>
        </div>
        <span
          className="relative z-10 mt-4 animate-pulse rounded-full px-12 py-5 text-3xl font-semibold shadow-2xl"
          style={{ backgroundColor: accent, color: '#000' }}
        >
          {name}
        </span>
      </button>
    );
  }

  // ---- Order type (between cart and payment) ------------------------------
  if (screen === 'type') {
    // Pick a service mode. Table service with a table list requires choosing a
    // table (revealed inline); counter pickup proceeds immediately.
    const pick = (mode: 'table' | 'counter') => {
      setServiceMode(mode);
      setTableId('');
      if (mode === 'table' && tables.length > 0) {
        setTypeChosen(true); // reveal the table picker
      } else {
        setScreen('payment');
      }
    };
    return (
      <KioskShell
        title={t('kiosk.type.title')}
        subtitle={t('kiosk.type.subtitle')}
        onHome={() => (typeChosen ? setTypeChosen(false) : setScreen('cart'))}
        homeLabel={t('kiosk.back')}
        coverUrl={coverUrl}
        // Step 3 of 4: menu (1) -> cart (2) -> service type (3) -> payment (4).
        step={3}
        accent={accent}
      >
        {!typeChosen ? (
          <div className="mx-auto grid max-w-3xl gap-6 p-8 sm:grid-cols-2">
            <TypeCard
              emoji="🪧"
              label={t('kiosk.type.table')}
              subtitle={t('kiosk.type.tableHint')}
              accent={accent}
              onClick={() => pick('table')}
            />
            <TypeCard
              emoji="🔔"
              label={t('kiosk.type.counter')}
              subtitle={t('kiosk.type.counterHint')}
              accent={accent}
              onClick={() => pick('counter')}
            />
          </div>
        ) : (
          /* Dine-in: choose a table, then continue to payment. */
          <div className="mx-auto w-full max-w-2xl rounded-3xl border border-black/10 bg-white p-8 text-neutral-900">
            <p className="mb-4 text-center text-2xl font-bold">
              {t('kiosk.type.chooseTable')}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {tables.map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setTableId(tb.id)}
                  className="min-w-[64px] rounded-2xl border-2 px-6 py-4 text-xl font-semibold transition-transform active:scale-95"
                  style={
                    tableId === tb.id
                      ? {
                          backgroundColor: accent,
                          color: '#000',
                          borderColor: accent,
                        }
                      : { borderColor: 'rgba(0,0,0,0.12)' }
                  }
                >
                  {tb.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setTypeChosen(false);
                setScreen('payment');
              }}
              disabled={!tableId}
              className="mt-8 w-full rounded-full px-8 py-5 text-2xl font-bold disabled:opacity-40"
              style={{ backgroundColor: accent, color: '#000' }}
            >
              {t('kiosk.continue')}
            </button>
          </div>
        )}
      </KioskShell>
    );
  }

  // ---- Confirmation -------------------------------------------------------
  if (screen === 'done' && confirmation) {
    // Rough estimated wait: base + per-item, capped. Purely indicative.
    const estMinutes = Math.min(30, 4 + cartCount * 1);
    return (
      <div className="relative flex h-screen w-screen flex-col overflow-y-auto bg-neutral-50 text-neutral-900">
        <div className="mx-auto w-full max-w-xl px-6 py-10 text-center">
          <span
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: '#0f766e', color: '#fff' }}
          >
            <Check className="h-10 w-10" />
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight">
            {t('kiosk.done.thanks')}
          </h1>
          <p className="mt-2 text-lg text-neutral-500">
            {t('kiosk.done.sent')}
          </p>

          {/* Order number ticket */}
          <div
            className="mt-8 rounded-3xl border-2 border-dashed p-6"
            style={{ borderColor: `${accent}80` }}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              {t('kiosk.done.orderNumber')}
            </p>
            <p
              className="mt-1 text-7xl font-extrabold tabular-nums"
              style={{ color: accent }}
            >
              #{confirmation.number ?? '—'}
            </p>
            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-base font-medium text-emerald-700">
              ⏱️ {t('kiosk.done.wait')} ≈ {estMinutes}{' '}
              {t('kiosk.done.minutes')}
            </span>
            <p className="mt-3 text-sm text-neutral-400">
              {t('kiosk.done.noteNumber')}
            </p>

            <div className="mt-5 space-y-1 border-t border-black/10 pt-4 text-left text-base">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">
                  {t('kiosk.done.service')}
                </span>
                <span className="font-medium">
                  {serviceMode === 'table'
                    ? t('kiosk.type.table')
                    : t('kiosk.type.counter')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">
                  {t('kiosk.done.payment')}
                </span>
                <span className="font-medium">
                  {t('kiosk.done.payAtCounter')}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                <span className="text-xl font-bold">{t('kiosk.total')}</span>
                <span className="text-xl font-bold" style={{ color: accent }}>
                  {fmt(cartTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Experience rating */}
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5">
            <p className="font-semibold">{t('kiosk.done.ratingQuestion')}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-2xl">😞</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => submitRating(n)}
                  aria-label={`${t('kiosk.done.rating')} ${n}`}
                  className="transition-transform active:scale-90"
                >
                  <Star
                    className="h-9 w-9"
                    style={{
                      fill: n <= rating ? accent : 'transparent',
                      color: n <= rating ? accent : 'rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              ))}
              <span className="text-2xl">😍</span>
            </div>
            <p className="mt-2 text-sm text-neutral-400">
              {rating > 0
                ? t('kiosk.done.ratingThanks')
                : t('kiosk.done.ratingScale')}
            </p>
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-6 w-full rounded-full px-12 py-5 text-2xl font-semibold"
            style={{ backgroundColor: accent, color: '#fff' }}
          >
            {t('kiosk.done.newOrder')}
          </button>
        </div>
      </div>
    );
  }

  // ---- Payment mode -------------------------------------------------------
  if (screen === 'payment') {
    return (
      <PaymentStep
        accent={accent}
        coverUrl={coverUrl}
        total={cartTotal}
        fmt={fmt}
        submitting={submitting}
        error={submitError}
        onBack={() => setScreen('type')}
        onPay={submitOrder}
      />
    );
  }

  // ---- Cart review --------------------------------------------------------
  if (screen === 'cart') {
    return (
      <>
        <CartReview
          lines={lines}
          currency={currency}
          accent={accent}
          note={note}
          setNote={setNote}
          suggestions={suggestions}
          showPhoto={cfg.showPhotos}
          onPickSuggestion={(dish) => {
            // Dishes with add-on groups open the detail overlay (so required
            // options can be chosen); simple items add straight to the cart.
            if ((dish.addonGroups ?? []).length > 0) {
              setDetailDish(dish);
            } else {
              addLine({
                lineId: uuidv4(),
                dishId: dish.id,
                dishName: dish.name,
                unitPrice: dish.price,
                quantity: 1,
                options: [],
                specialRequest: '',
              });
            }
          }}
          onChangeQty={changeQty}
          onRemove={removeLine}
          onBack={() => setScreen('menu')}
          onProceed={() => setScreen('type')}
          fmt={fmt}
        />
        {/* Add-on picker overlay for suggestions with options. */}
        {detailDish ? (
          <ItemDetail
            dish={detailDish}
            currency={currency}
            accent={accent}
            showPhoto={cfg.showPhotos}
            onClose={() => setDetailDish(null)}
            onAdd={(line) => {
              addLine(line);
              setDetailDish(null);
            }}
            fmt={fmt}
          />
        ) : null}
      </>
    );
  }

  // ---- Menu (main) --------------------------------------------------------
  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-50 text-neutral-900">
      {/* Compact top bar (home + name) — no menu switcher: the kiosk shows all
          available menus' categories together. */}
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-3">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 text-base font-medium text-neutral-500"
        >
          {/* Directional icon: mirror it under RTL. */}
          <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" /> {t('kiosk.home')}
        </button>
        <span className="text-xl font-bold">{name}</span>
        <KioskLangSwitcher />
      </header>

      {/* Step progress */}
      <KioskSteps
        current={1}
        title={t('kiosk.menu.title')}
        subtitle={t('kiosk.menu.subtitle')}
        accent={accent}
      />

      <div className="flex min-h-0 flex-1">
        {/* Category rail — reflects the section currently in view (scrollspy);
            tapping a category scrolls to it. */}
        <nav className="w-44 shrink-0 overflow-y-auto border-r border-black/10 bg-white py-4">
          {allCategories.map((cat) => {
            const active = cat.id === activeCatId;
            return (
              <button
                key={cat.id}
                type="button"
                ref={(el) => {
                  railRefs.current[cat.id] = el;
                }}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  'flex w-full flex-col items-center gap-1 px-2 py-4 text-center text-base font-medium transition-colors',
                  active ? 'text-neutral-900' : 'text-neutral-400'
                )}
                style={
                  active
                    ? { borderLeft: `4px solid ${accent}`, background: `${accent}14` }
                    : { borderLeft: '4px solid transparent' }
                }
              >
                <span className="line-clamp-2">{cat.name}</span>
              </button>
            );
          })}
        </nav>

        {/* All categories, one scrollable list (dishes of every available menu). */}
        <div ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto p-6">
          {allCategories.length === 0 ? (
            <p className="text-xl text-neutral-400">{t('kiosk.menu.empty')}</p>
          ) : (
            allCategories.map((cat) => (
              <section
                key={cat.id}
                data-cat-id={cat.id}
                ref={(el) => {
                  sectionRefs.current[cat.id] = el;
                }}
                className="mb-10 scroll-mt-4"
              >
                <h2 className="mb-4 text-3xl font-bold">{cat.name}</h2>
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                  {cat.dishes.map((dish) => (
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      accent={accent}
                      showPhoto={cfg.showPhotos}
                      fmt={fmt}
                      onClick={() => setDetailDish(dish)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      {/* Persistent cart bar */}
      {cartCount > 0 ? (
        <button
          type="button"
          onClick={() => setScreen('cart')}
          className="flex items-center justify-between gap-4 px-6 py-4 text-2xl font-semibold text-black"
          style={{ backgroundColor: accent }}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/15">
              <ShoppingBag className="h-5 w-5" />
            </span>
            {cartCount}{' '}
            {cartCount > 1
              ? t('kiosk.menu.itemMany')
              : t('kiosk.menu.itemOne')}
          </span>
          <span>
            {t('kiosk.menu.viewOrder')} · {fmt(cartTotal)}
          </span>
        </button>
      ) : null}

      {/* Item detail overlay */}
      {detailDish ? (
        <ItemDetail
          dish={detailDish}
          currency={currency}
          accent={accent}
          showPhoto={cfg.showPhotos}
          onClose={() => setDetailDish(null)}
          onAdd={(line) => {
            addLine(line);
            setDetailDish(null);
          }}
          fmt={fmt}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KioskShell({
  title,
  subtitle,
  onHome,
  homeLabel,
  coverUrl,
  step,
  accent,
  children,
}: {
  title: string;
  subtitle?: string;
  onHome: () => void;
  /** Defaults to the localized "Accueil" when omitted. */
  homeLabel?: string;
  coverUrl?: string | null;
  /**
   * 1-based position in the kiosk stepper. When given (with `accent`) the shell
   * renders the same KioskSteps bar the menu and cart screens use, and drops its
   * own centered title so the heading isn't duplicated.
   *
   * Screens that hand-rolled their own header used to skip the stepper entirely,
   * so it vanished mid-flow on the service-type screen.
   */
  step?: number;
  accent?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const hasCover = !!coverUrl;
  const showSteps = step != null && !!accent;
  return (
    <div
      className={cn(
        'relative flex h-screen w-screen flex-col overflow-hidden text-neutral-900',
        hasCover ? 'bg-neutral-950 text-neutral-50' : 'bg-neutral-50'
      )}
    >
      <CoverBackdrop coverUrl={coverUrl} />
      <header
        className={cn(
          'relative z-10 flex items-center gap-4 border-b px-6 py-4',
          hasCover
            ? 'border-white/10 bg-white/5 backdrop-blur-sm'
            : 'border-black/10 bg-white'
        )}
      >
        <button
          type="button"
          onClick={onHome}
          className={cn(
            'flex items-center gap-2 text-lg font-medium',
            hasCover ? 'text-white/70' : 'text-neutral-500'
          )}
        >
          <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />{' '}
          {homeLabel ?? t('kiosk.home')}
        </button>
        <KioskLangSwitcher onDark={hasCover} className="ms-auto" />
      </header>

      {/* Stepper bar, when this screen is part of the numbered flow. It carries
          the title/subtitle itself, so the centered block below is skipped. */}
      {showSteps ? (
        <div className="relative z-10">
          <KioskSteps
            current={step as number}
            title={title}
            subtitle={subtitle ?? ''}
            accent={accent as string}
            onDark={hasCover}
          />
        </div>
      ) : null}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        {!showSteps ? (
          <div className="mb-8 px-6 text-center">
            <h1
              className={cn(
                'text-4xl font-extrabold tracking-tight',
                hasCover && 'drop-shadow-lg'
              )}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                className={cn(
                  'mt-2 text-lg',
                  hasCover ? 'text-white/70' : 'text-neutral-400'
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function TypeCard({
  emoji,
  label,
  subtitle,
  accent,
  onClick,
}: {
  emoji: string;
  label: string;
  subtitle?: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ['--rim' as string]: accent }}
      className={cn(
        'group flex flex-col items-center gap-4 rounded-3xl border-2 border-black/10 bg-white p-12 text-neutral-900 shadow-sm',
        'transition-all duration-150 active:scale-[0.97]',
        // Highlight rim on hover (accent-colored border + glow ring).
        'hover:-translate-y-1 hover:border-[color:var(--rim)] hover:shadow-xl',
        'hover:ring-4 hover:ring-[color:var(--rim)]/25'
      )}
    >
      <span
        className={cn(
          'flex h-24 w-24 items-center justify-center rounded-3xl text-5xl',
          // Lean/tilt the icon on click (and a gentle nudge on hover).
          'transition-transform duration-150 group-hover:-rotate-3 group-active:rotate-12 group-active:scale-95'
        )}
        style={{ backgroundColor: `${accent}22` }}
      >
        {emoji}
      </span>
      <span className="text-3xl font-bold">{label}</span>
      {subtitle ? (
        <span className="text-base text-neutral-500">{subtitle}</span>
      ) : null}
    </button>
  );
}

/** A single dish card in the kiosk menu grid. */
function DishCard({
  dish,
  accent,
  showPhoto,
  fmt,
  onClick,
}: {
  dish: Dish;
  accent: string;
  showPhoto: boolean;
  fmt: (n: number) => string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white text-left text-neutral-900 shadow-sm transition-transform active:scale-[0.98]"
    >
      {showPhoto && dish.photo ? (
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={dish.photo}
            alt={dish.name}
            fill
            className="object-cover"
            sizes="(max-width:1280px) 33vw, 25vw"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-neutral-100 text-neutral-300">
          <UtensilsCrossed className="h-10 w-10" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-3">
        <p className="text-lg font-semibold leading-tight">{dish.name}</p>
        {dish.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
            {dish.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xl font-bold" style={{ color: accent }}>
            {fmt(dish.price)}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: accent, color: '#000' }}
          >
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </div>
    </button>
  );
}

/** Item detail overlay: photo, description, add-on groups, quantity, add. */
function ItemDetail({
  dish,
  currency,
  accent,
  showPhoto,
  onClose,
  onAdd,
  fmt,
}: {
  dish: Dish;
  currency: string;
  accent: string;
  showPhoto: boolean;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
  fmt: (n: number) => string;
}) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [special, setSpecial] = useState('');

  const toggle = (group: AddonGroup, optionId: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      const cur = new Set(next[group.id] ?? []);
      if (group.type === 'SINGLE') {
        if (cur.has(optionId)) cur.clear();
        else {
          cur.clear();
          cur.add(optionId);
        }
      } else {
        if (cur.has(optionId)) cur.delete(optionId);
        else cur.add(optionId);
      }
      next[group.id] = cur;
      return next;
    });
  };

  const selectedOptions = useMemo(() => {
    const out: CartLine['options'] = [];
    for (const group of dish.addonGroups ?? []) {
      const chosen = selected[group.id];
      if (!chosen) continue;
      for (const opt of group.options) {
        if (chosen.has(opt.id)) {
          out.push({
            id: opt.id,
            groupName: group.name,
            name: opt.name,
            priceDelta: opt.priceDelta,
          });
        }
      }
    }
    return out;
  }, [dish, selected]);

  const missingRequired = (dish.addonGroups ?? []).some(
    (g) => g.required && !(selected[g.id]?.size)
  );

  const unit =
    dish.price + selectedOptions.reduce((s, o) => s + o.priceDelta, 0);

  const add = () => {
    if (missingRequired) return;
    onAdd({
      lineId: uuidv4(),
      dishId: dish.id,
      dishName: dish.name,
      unitPrice: dish.price,
      quantity,
      options: selectedOptions,
      specialRequest: special.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex-1 overflow-y-auto">
          {showPhoto && dish.photo ? (
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={dish.photo}
                alt={dish.name}
                fill
                className="object-cover"
                sizes="672px"
              />
            </div>
          ) : null}
          <div className="p-6">
            <h2 className="text-3xl font-bold">{dish.name}</h2>
            {dish.description ? (
              <p className="mt-2 text-lg text-neutral-500">{dish.description}</p>
            ) : null}

            {(dish.addonGroups ?? []).map((group) => (
              <div key={group.id} className="mt-6">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{group.name}</h3>
                  {group.required ? (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: `${accent}22`, color: accent }}
                    >
                      {t('kiosk.item.required')}
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.options.map((opt) => {
                    const on = selected[group.id]?.has(opt.id) ?? false;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggle(group, opt.id)}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-xl border-2 p-4 text-left text-lg transition-colors'
                        )}
                        style={
                          on
                            ? { borderColor: accent, background: `${accent}10` }
                            : { borderColor: 'rgba(0,0,0,0.1)' }
                        }
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full border-2"
                            style={{
                              borderColor: on ? accent : 'rgba(0,0,0,0.2)',
                              background: on ? accent : 'transparent',
                              color: '#000',
                            }}
                          >
                            {on ? <Check className="h-4 w-4" /> : null}
                          </span>
                          {opt.name}
                        </span>
                        {opt.priceDelta ? (
                          <span className="font-semibold text-neutral-500">
                            +{fmt(opt.priceDelta)}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="mt-6">
              <label className="mb-1 block text-lg font-semibold">
                {t('kiosk.item.note')}
              </label>
              <input
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
                placeholder={t('kiosk.item.notePlaceholder')}
                className="w-full rounded-xl border-2 border-black/10 p-4 text-lg outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-black/10 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-4 text-lg font-semibold text-neutral-500"
          >
            {t('kiosk.cancel')}
          </button>
          <div className="ml-auto flex items-center gap-2 rounded-full border-2 border-black/10 px-3 py-2">
            <button
              type="button"
              aria-label="-"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="w-8 text-center text-2xl font-bold">{quantity}</span>
            <button
              type="button"
              aria-label="+"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={missingRequired}
            className="rounded-full px-8 py-4 text-xl font-bold disabled:opacity-40"
            style={{ backgroundColor: accent, color: '#000' }}
          >
            {t('kiosk.add')} · {fmt(unit * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Horizontal strip for the cart upsell suggestions.
 *
 * The plain `overflow-x-auto` div this replaces could not actually be scrolled in
 * practice: it hides its scrollbar (`scrollbar-width: none` plus the webkit rule)
 * for a clean kiosk look, which leaves a mouse user with nothing to drag, and the
 * overflow direction flips under RTL so the cut-off cards sit off the LEFT edge in
 * Arabic. Native swipe/trackpad scrolling still works; this adds the affordances
 * that were missing around it.
 *
 * Direction handling is the fiddly part: `scrollBy({ left })` is PHYSICAL, while
 * "next" is leftward in RTL and rightward in LTR. The sign is derived from the
 * element's computed direction rather than assumed, and the arrow glyphs swap to
 * match, so "next" always points at unseen content.
 */
function UpsellStrip({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const measure = () => {
      // 4px of slack: sub-pixel widths otherwise report a phantom overflow.
      setCanScroll(el.scrollWidth - el.clientWidth > 4);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  const nudge = (forward: boolean) => {
    const el = scroller.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl';
    // Card (w-40 = 160px) + gap-3 (12px). Two at a time feels right on a big
    // touch screen without skipping content.
    const step = 172 * 2;
    const physical = forward === rtl ? -step : step;
    el.scrollBy({ left: physical, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={scroller}
        // touch-pan-x + overscroll-x-contain keep a horizontal swipe here from
        // being stolen by the vertically scrolling cart behind it.
        className="-mx-1 flex touch-pan-x gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {canScroll ? (
        <>
          <button
            type="button"
            aria-label={t('kiosk.scrollPrev')}
            onClick={() => nudge(false)}
            className="absolute start-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2 shadow-md ring-1 ring-black/10 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5 rtl:hidden" />
            <ChevronRight className="hidden h-5 w-5 rtl:block" />
          </button>
          <button
            type="button"
            aria-label={t('kiosk.scrollNext')}
            onClick={() => nudge(true)}
            className="absolute end-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2 shadow-md ring-1 ring-black/10 active:scale-95"
          >
            <ChevronRight className="h-5 w-5 rtl:hidden" />
            <ChevronLeft className="hidden h-5 w-5 rtl:block" />
          </button>
        </>
      ) : null}
    </div>
  );
}

/** Cart review + submit screen. */
function CartReview({
  lines,
  currency,
  accent,
  note,
  setNote,
  suggestions,
  showPhoto,
  onPickSuggestion,
  onChangeQty,
  onRemove,
  onBack,
  onProceed,
  fmt,
}: {
  lines: CartLine[];
  currency: string;
  accent: string;
  note: string;
  setNote: (v: string) => void;
  /** Upsell dishes shown under the cart ("Recommandé avec votre commande"). */
  suggestions: Dish[];
  showPhoto: boolean;
  onPickSuggestion: (dish: Dish) => void;
  onChangeQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
  onBack: () => void;
  onProceed: () => void;
  fmt: (n: number) => string;
}) {
  const { t } = useI18n();
  const total = lines.reduce((s, l) => s + lineTotal(l), 0);

  const proceed = () => {
    if (lines.length === 0) return;
    onProceed();
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-50 text-neutral-900">
      <header className="flex items-center gap-4 border-b border-black/10 bg-white px-6 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-base font-medium text-neutral-500"
        >
          <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />{' '}
          {t('kiosk.menuLabel')}
        </button>
        <KioskLangSwitcher className="ms-auto" />
      </header>

      {/* Step progress */}
      <KioskSteps
        current={2}
        title={t('kiosk.cart.title')}
        subtitle={t('kiosk.cart.subtitle')}
        accent={accent}
      />


      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto p-6">
        {lines.length === 0 ? (
          <p className="mt-20 text-center text-2xl text-neutral-400">
            {t('kiosk.cart.empty')}
          </p>
        ) : (
          <div className="space-y-3">
            {lines.map((l) => (
              <div
                key={l.lineId}
                className="rounded-2xl border border-black/10 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xl font-semibold">{l.dishName}</p>
                    {l.options.length > 0 ? (
                      <p className="text-base text-neutral-500">
                        {l.options.map((o) => o.name).join(', ')}
                      </p>
                    ) : null}
                    {l.specialRequest ? (
                      <p className="text-base italic text-neutral-400">
                        “{l.specialRequest}”
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label="remove"
                    onClick={() => onRemove(l.lineId)}
                    className="text-neutral-400"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full border-2 border-black/10 px-3 py-1.5">
                    <button
                      type="button"
                      aria-label="-"
                      onClick={() =>
                        onChangeQty(l.lineId, Math.max(1, l.quantity - 1))
                      }
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-7 text-center text-xl font-bold">
                      {l.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="+"
                      onClick={() =>
                        onChangeQty(l.lineId, Math.min(99, l.quantity + 1))
                      }
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <span className="text-xl font-bold" style={{ color: accent }}>
                    {fmt(lineTotal(l))}
                  </span>
                </div>
              </div>
            ))}

            {/* Optional kitchen note (service mode is chosen on the next step). */}
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('kiosk.cart.notePlaceholder')}
                className="w-full rounded-xl border-2 border-black/10 p-4 text-lg outline-none"
              />
            </div>

            {/* Upsell — "Recommandé avec votre commande". */}
            {suggestions.length > 0 ? (
              <div
                className="rounded-2xl border-2 border-dashed p-4"
                style={{ borderColor: `${accent}66`, background: `${accent}0d` }}
              >
                <p className="mb-3 flex items-center gap-2 text-lg font-bold">
                  <span className="text-xl">✨</span>
                  {t('kiosk.cart.upsell')}
                </p>
                <UpsellStrip>
                  {suggestions.map((dish) => (
                    <button
                      key={dish.id}
                      type="button"
                      onClick={() => onPickSuggestion(dish)}
                      className="flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white text-left text-neutral-900 shadow-sm transition-transform active:scale-[0.97]"
                    >
                      {showPhoto && dish.photo ? (
                        <div className="relative aspect-[4/3] w-full">
                          <Image
                            src={dish.photo}
                            alt={dish.name}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[4/3] w-full items-center justify-center bg-neutral-100 text-neutral-300">
                          <UtensilsCrossed className="h-8 w-8" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-2.5">
                        <p className="line-clamp-2 text-sm font-semibold leading-tight">
                          {dish.name}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <span
                            className="text-sm font-bold"
                            style={{ color: accent }}
                          >
                            {fmt(dish.price)}
                          </span>
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-full"
                            style={{ backgroundColor: accent, color: '#000' }}
                          >
                            <Plus className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </UpsellStrip>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Footer total + confirm */}
      {lines.length > 0 ? (
        <div className="border-t border-black/10 bg-white p-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div>
              <p className="text-lg text-neutral-500">{t('kiosk.total')}</p>
              <p className="text-3xl font-bold" style={{ color: accent }}>
                {fmt(total)}
              </p>
            </div>
            <button
              type="button"
              onClick={proceed}
              className="flex items-center gap-2 rounded-full px-10 py-5 text-2xl font-bold"
              style={{ backgroundColor: accent, color: '#000' }}
            >
              {t('kiosk.continue')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Payment mode step. Cash-at-counter only for now ("Payer au comptoir"); tapping
 * it submits the order. A "Retour" link goes back to the cart.
 */
function PaymentStep({
  accent,
  coverUrl,
  total,
  fmt,
  submitting,
  error,
  onBack,
  onPay,
}: {
  accent: string;
  coverUrl?: string | null;
  total: number;
  fmt: (n: number) => string;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onPay: () => void;
}) {
  const { t } = useI18n();
  const hasCover = !!coverUrl;
  return (
    <div
      className={cn(
        // No items-center/justify-center/px-6 on the root any more: the steps bar
        // must run full-bleed across the top, so the centering moved to the
        // flex-1 content wrapper below it.
        'relative flex h-screen w-screen flex-col overflow-hidden text-neutral-900',
        hasCover ? 'bg-neutral-950 text-neutral-50' : 'bg-neutral-50'
      )}
    >
      <CoverBackdrop coverUrl={coverUrl} />

      {/* Step 4 of 4. This screen used to render no stepper at all, so the
          progress bar vanished the moment a diner picked table service or
          takeaway on the previous screen and landed here. The bar carries the
          heading, so the card below no longer repeats it. */}
      <div className="relative z-10">
        <KioskSteps
          current={4}
          title={t('kiosk.pay.title')}
          subtitle=""
          accent={accent}
          onDark={hasCover}
        />
        <KioskLangSwitcher
          onDark={hasCover}
          className="absolute end-6 top-5 z-30"
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-3xl border border-black/10 bg-white p-8 text-neutral-900 shadow-xl">
        <button
          type="button"
          onClick={onPay}
          disabled={submitting}
          // No mt-4: this used to sit below a "Mode de paiement" label that the
          // steps bar now carries, so the margin would be a stray gap.
          className="flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-5 text-2xl font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{ backgroundColor: accent, color: '#000' }}
        >
          <span className="flex items-center gap-3">
            {submitting ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <span className="text-2xl">💵</span>
            )}
            {t('kiosk.pay.counter')}
          </span>
          <span className="rounded-lg bg-black/15 px-3 py-1 text-xl">
            {fmt(total)}
          </span>
        </button>

        {error ? (
          <p className="mt-4 text-center text-lg text-red-500">{error}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className={cn(
          'relative z-10 mt-6 text-lg font-medium',
          hasCover ? 'text-white/70' : 'text-neutral-500'
        )}
      >
        <span aria-hidden className="rtl:hidden">
          ←{' '}
        </span>
        {t('kiosk.back')}
        <span aria-hidden className="hidden rtl:inline">
          {' '}
          →
        </span>
      </button>
      </div>
    </div>
  );
}
