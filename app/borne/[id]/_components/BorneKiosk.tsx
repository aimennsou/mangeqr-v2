'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  UtensilsCrossed,
  Loader2,
  PartyPopper,
} from 'lucide-react';

import { resolveBorneConfig, type BorneConfig } from '@/schemas';
import { cn } from '@/lib/utils';
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

type Screen = 'welcome' | 'type' | 'menu' | 'cart' | 'done';
type OrderType = 'DINE_IN' | 'DELIVERY';

// The kiosk step sequence shown in the top stepper. The final node is the
// payment/confirmation (card icon). `current` is the 1-based active step.
const KIOSK_STEP_COUNT = 4; // numbered steps before the card node

function KioskSteps({
  current,
  title,
  subtitle,
  accent,
}: {
  current: number;
  title: string;
  subtitle: string;
  accent: string;
}) {
  const numbered = [1, 2, 3, 4];
  return (
    <div className="border-b border-black/10 bg-white px-6 py-5">
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
                    done || active ? 'text-white' : 'text-neutral-400'
                  )}
                  style={
                    done || active
                      ? { backgroundColor: accent, color: '#000' }
                      : { border: '2px solid rgba(0,0,0,0.15)' }
                  }
                >
                  {done ? <Check className="h-5 w-5" /> : n}
                </span>
                <span
                  className="h-0.5 w-6 rounded-full"
                  style={{
                    backgroundColor:
                      n < current ? accent : 'rgba(0,0,0,0.12)',
                  }}
                />
              </div>
            );
          })}
          {/* Payment / confirmation node (card icon). */}
          <span
            className={cn(
              'flex h-10 w-12 shrink-0 items-center justify-center rounded-full transition-colors',
              current > KIOSK_STEP_COUNT ? '' : 'text-neutral-400'
            )}
            style={
              current > KIOSK_STEP_COUNT
                ? { backgroundColor: accent, color: '#000' }
                : { border: '2px solid rgba(0,0,0,0.15)' }
            }
          >
            <CreditCard className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-5 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-lg text-neutral-400">{subtitle}</p>
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
      <div className="absolute inset-0 bg-neutral-950/70" />
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
export function BorneKiosk({
  restaurantId,
  name,
  currency,
  coverUrl,
  menus,
  tables,
  borneConfig,
}: BorneKioskProps) {
  const cfg = resolveBorneConfig(borneConfig);
  const accent = cfg.accent;

  const [screen, setScreen] = useState<Screen>('welcome');
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tableId, setTableId] = useState('');
  const [lines, setLines] = useState<CartLine[]>([]);
  const [activeMenuId, setActiveMenuId] = useState(menus[0]?.id ?? '');
  const [activeCatId, setActiveCatId] = useState<string>(
    menus[0]?.categories[0]?.id ?? ''
  );
  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [confirmation, setConfirmation] = useState<{
    id: string;
    number: number | null;
  } | null>(null);

  const menu = useMemo(
    () => menus.find((m) => m.id === activeMenuId) ?? menus[0],
    [menus, activeMenuId]
  );
  const activeCat = useMemo(
    () => menu?.categories.find((c) => c.id === activeCatId) ?? menu?.categories[0],
    [menu, activeCatId]
  );

  const fmt = (n: number) =>
    (Number.isInteger(n) ? n.toString() : n.toFixed(2)) + ' ' + currency;
  const cartCount = lines.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = lines.reduce((s, l) => s + lineTotal(l), 0);

  const addLine = (line: CartLine) => setLines((prev) => [...prev, line]);
  const changeQty = (lineId: string, qty: number) =>
    setLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, quantity: qty } : l))
    );
  const removeLine = (lineId: string) =>
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));

  const reset = () => {
    setLines([]);
    setTableId('');
    setDetailDish(null);
    setConfirmation(null);
    setScreen('welcome');
  };

  // ---- Welcome ------------------------------------------------------------
  if (screen === 'welcome') {
    return (
      <button
        type="button"
        onClick={() => setScreen('type')}
        className="relative flex h-screen w-screen flex-col items-center justify-center gap-10 overflow-hidden bg-neutral-950 text-center text-neutral-50"
      >
        <CoverBackdrop coverUrl={coverUrl} />
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

  // ---- Order type ---------------------------------------------------------
  if (screen === 'type') {
    const pick = (t: OrderType) => {
      setOrderType(t);
      setScreen('menu');
    };
    return (
      <KioskShell
        title="Comment souhaitez-vous commander ?"
        onHome={reset}
        coverUrl={coverUrl}
      >
        <div className="mx-auto grid max-w-3xl gap-6 p-8 sm:grid-cols-2">
          <TypeCard
            icon={<Store className="h-16 w-16" />}
            label="Sur place"
            accent={accent}
            onClick={() => pick('DINE_IN')}
          />
          <TypeCard
            icon={<ShoppingBag className="h-16 w-16" />}
            label="À emporter"
            accent={accent}
            onClick={() => pick('DELIVERY')}
          />
        </div>
      </KioskShell>
    );
  }

  // ---- Confirmation -------------------------------------------------------
  if (screen === 'done' && confirmation) {
    return (
      <div className="relative flex h-screen w-screen flex-col items-center justify-center gap-8 overflow-hidden bg-neutral-950 text-center text-neutral-50">
        <CoverBackdrop coverUrl={coverUrl} />
        <span
          className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full shadow-2xl"
          style={{ backgroundColor: accent, color: '#000' }}
        >
          <PartyPopper className="h-14 w-14" />
        </span>
        <div className="relative z-10">
          <h1 className="font-serif-display text-6xl font-light drop-shadow-lg">Merci !</h1>
          <p className="mt-4 text-3xl text-white/70">
            Votre commande est enregistrée.
          </p>
        </div>
        {confirmation.number != null ? (
          <div className="relative z-10 mt-2">
            <p className="text-xl uppercase tracking-widest text-white/50">
              Votre numéro
            </p>
            <p
              className="font-serif-display text-8xl font-medium tabular-nums drop-shadow-lg"
              style={{ color: accent }}
            >
              #{confirmation.number}
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="relative z-10 mt-6 rounded-full px-12 py-5 text-2xl font-semibold shadow-2xl"
          style={{ backgroundColor: accent, color: '#000' }}
        >
          Nouvelle commande
        </button>
      </div>
    );
  }

  // ---- Cart review --------------------------------------------------------
  if (screen === 'cart') {
    return (
      <CartReview
        lines={lines}
        currency={currency}
        accent={accent}
        orderType={orderType}
        tables={tables}
        tableId={tableId}
        setTableId={setTableId}
        setOrderType={setOrderType}
        onChangeQty={changeQty}
        onRemove={removeLine}
        onBack={() => setScreen('menu')}
        onDone={(id, number) => {
          setConfirmation({ id, number });
          setScreen('done');
        }}
        restaurantId={restaurantId}
        fmt={fmt}
      />
    );
  }

  // ---- Menu (main) --------------------------------------------------------
  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-50 text-neutral-900">
      {/* Compact top bar (home + name + menu switcher) */}
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-3">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 text-base font-medium text-neutral-500"
        >
          <ArrowLeft className="h-5 w-5" /> Accueil
        </button>
        <span className="text-xl font-bold">{name}</span>
        {menus.length > 1 ? (
          <select
            value={activeMenuId}
            onChange={(e) => {
              setActiveMenuId(e.target.value);
              const m = menus.find((mm) => mm.id === e.target.value);
              setActiveCatId(m?.categories[0]?.id ?? '');
            }}
            className="rounded-lg border border-black/10 px-3 py-2 text-lg"
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="w-24" />
        )}
      </header>

      {/* Step progress */}
      <KioskSteps
        current={1}
        title="Choisissez votre plat"
        subtitle="Choisissez pour commencer"
        accent={accent}
      />

      <div className="flex min-h-0 flex-1">
        {/* Category rail */}
        <nav className="w-44 shrink-0 overflow-y-auto border-r border-black/10 bg-white py-4">
          {menu?.categories.map((cat) => {
            const active = cat.id === activeCat?.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCatId(cat.id)}
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

        {/* Dish grid */}
        <div className="min-w-0 flex-1 overflow-y-auto p-6">
          <h2 className="mb-4 text-3xl font-bold">{activeCat?.name}</h2>
          {!activeCat || activeCat.dishes.length === 0 ? (
            <p className="text-xl text-neutral-400">Aucun plat.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {activeCat.dishes.map((dish) => (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => setDetailDish(dish)}
                  className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white text-left shadow-sm transition-transform active:scale-[0.98]"
                >
                  {cfg.showPhotos && dish.photo ? (
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
                    <p className="text-lg font-semibold leading-tight">
                      {dish.name}
                    </p>
                    {dish.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                        {dish.description}
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span
                        className="text-xl font-bold"
                        style={{ color: accent }}
                      >
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
              ))}
            </div>
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
            {cartCount} article{cartCount > 1 ? 's' : ''}
          </span>
          <span>Voir ma commande · {fmt(cartTotal)}</span>
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
  onHome,
  coverUrl,
  children,
}: {
  title: string;
  onHome: () => void;
  coverUrl?: string | null;
  children: React.ReactNode;
}) {
  const hasCover = !!coverUrl;
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
          <ArrowLeft className="h-5 w-5" /> Accueil
        </button>
      </header>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <h1
          className={cn(
            'mb-8 px-6 text-center font-serif-display text-4xl font-light',
            hasCover && 'drop-shadow-lg'
          )}
        >
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

function TypeCard({
  icon,
  label,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ['--rim' as string]: accent }}
      className={cn(
        'group flex flex-col items-center gap-6 rounded-3xl border-2 border-black/10 bg-white p-12 shadow-sm',
        'transition-all duration-150 active:scale-[0.97]',
        // Highlight rim on hover (accent-colored border + glow ring).
        'hover:-translate-y-1 hover:border-[color:var(--rim)] hover:shadow-xl',
        'hover:ring-4 hover:ring-[color:var(--rim)]/25'
      )}
    >
      <span
        className={cn(
          'flex h-28 w-28 items-center justify-center rounded-3xl',
          // Lean/tilt the icon on click (and a gentle nudge on hover).
          'transition-transform duration-150 group-hover:-rotate-3 group-active:rotate-12 group-active:scale-95'
        )}
        style={{ backgroundColor: `${accent}22`, color: accent }}
      >
        {icon}
      </span>
      <span className="text-3xl font-semibold">{label}</span>
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
                      Requis
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
                Remarque (optionnel)
              </label>
              <input
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
                placeholder="Sans oignons, bien cuit…"
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
            Annuler
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
            Ajouter · {fmt(unit * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Cart review + submit screen. */
function CartReview({
  lines,
  currency,
  accent,
  orderType,
  tables,
  tableId,
  setTableId,
  setOrderType,
  onChangeQty,
  onRemove,
  onBack,
  onDone,
  restaurantId,
  fmt,
}: {
  lines: CartLine[];
  currency: string;
  accent: string;
  orderType: OrderType;
  tables: DinerTable[];
  tableId: string;
  setTableId: (v: string) => void;
  setOrderType: (t: OrderType) => void;
  onChangeQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
  onBack: () => void;
  onDone: (id: string, number: number | null) => void;
  restaurantId: string;
  fmt: (n: number) => string;
}) {
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = lines.reduce((s, l) => s + lineTotal(l), 0);

  const submit = async () => {
    setError(null);
    if (lines.length === 0) return;
    if (orderType === 'DINE_IN' && tables.length > 0 && !tableId) {
      setError('Sélectionnez votre table.');
      return;
    }
    const payload = {
      restaurantId,
      type: orderType,
      tableId: orderType === 'DINE_IN' ? tableId || null : null,
      customerName: orderType === 'DELIVERY' ? name.trim() : '',
      customerPhone: orderType === 'DELIVERY' ? phone.trim() : '',
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
        setError(data?.error ?? 'Une erreur est survenue.');
        return;
      }
      onDone(
        data.id,
        typeof data.orderNumber === 'number' ? data.orderNumber : null
      );
    } catch {
      setError('Une erreur réseau est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-50 text-neutral-900">
      <header className="flex items-center gap-4 border-b border-black/10 bg-white px-6 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-base font-medium text-neutral-500"
        >
          <ArrowLeft className="h-5 w-5" /> Menu
        </button>
      </header>

      {/* Step progress */}
      <KioskSteps
        current={3}
        title="Vérifiez votre commande"
        subtitle="Modifiez les quantités puis validez"
        accent={accent}
      />


      <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto p-6">
        {lines.length === 0 ? (
          <p className="mt-20 text-center text-2xl text-neutral-400">
            Votre panier est vide.
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

            {/* Order type + table */}
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex rounded-full border-2 border-black/10 p-1">
                {(['DINE_IN', 'DELIVERY'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrderType(t)}
                    className="flex-1 rounded-full px-3 py-2 text-lg font-medium"
                    style={
                      orderType === t
                        ? { backgroundColor: accent, color: '#000' }
                        : { color: '#737373' }
                    }
                  >
                    {t === 'DINE_IN' ? 'Sur place' : 'À emporter'}
                  </button>
                ))}
              </div>

              {orderType === 'DINE_IN' && tables.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-lg font-semibold">Votre table</p>
                  <div className="flex flex-wrap gap-2">
                    {tables.map((tb) => (
                      <button
                        key={tb.id}
                        type="button"
                        onClick={() => setTableId(tb.id)}
                        className="min-w-[52px] rounded-xl border-2 px-4 py-3 text-lg font-medium"
                        style={
                          tableId === tb.id
                            ? {
                                backgroundColor: accent,
                                color: '#000',
                                borderColor: accent,
                              }
                            : { borderColor: 'rgba(0,0,0,0.1)' }
                        }
                      >
                        {tb.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {orderType === 'DELIVERY' ? (
                <div className="mt-4 space-y-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom (optionnel)"
                    className="w-full rounded-xl border-2 border-black/10 p-4 text-lg outline-none"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Téléphone (optionnel)"
                    inputMode="tel"
                    className="w-full rounded-xl border-2 border-black/10 p-4 text-lg outline-none"
                  />
                </div>
              ) : null}

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Remarque pour la cuisine (optionnel)"
                className="mt-2 w-full rounded-xl border-2 border-black/10 p-4 text-lg outline-none"
              />
            </div>

            {error ? (
              <p className="text-center text-lg text-red-500">{error}</p>
            ) : null}
          </div>
        )}
      </div>

      {/* Footer total + confirm */}
      {lines.length > 0 ? (
        <div className="border-t border-black/10 bg-white p-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div>
              <p className="text-lg text-neutral-500">Total</p>
              <p className="text-3xl font-bold" style={{ color: accent }}>
                {fmt(total)}
              </p>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-full px-10 py-5 text-2xl font-bold disabled:opacity-50"
              style={{ backgroundColor: accent, color: '#000' }}
            >
              {submitting ? <Loader2 className="h-6 w-6 animate-spin" /> : null}
              Commander
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
