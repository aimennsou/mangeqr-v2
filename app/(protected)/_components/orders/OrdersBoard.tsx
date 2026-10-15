'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { OrderStatus } from '@prisma/client';
import { Bell, Loader2, Search, Volume2, VolumeX, X } from 'lucide-react';
import { toast } from 'sonner';
import type { OrderView } from '@/data/orders';
import { printOrderTicket } from './print-ticket';
import { claimAutoPrint } from './print-dedupe';
import FullscreenButton from '../FullscreenButton';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useOrdersPoll } from './useOrdersPoll';
import { usePrinterConfigs } from './usePrinterConfigs';
import { useTicketOptions } from './useTicketStrings';
import { OrderCard } from './OrderCard';
import { playNewOrderChime } from './notify';
import { orderStatusLabel } from './order-status';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

const ALL = '__all__';

/**
 * Rolling time windows for the feed. Defaults to today so the board shows a
 * bounded, meaningful list — it used to request every order ever placed and let
 * the server's `take: 200` truncate it silently.
 *
 * `labelKey` used to hold the literal French label despite its name, which is
 * why the period dropdown stayed French on an Arabic screen. It now holds an
 * actual dictionary key, resolved per render.
 */
const SCOPES: { value: string; labelKey: TranslationKey }[] = [
  { value: '1', labelKey: 'orders.filter.today' },
  { value: '7', labelKey: 'orders.filter.last7' },
  { value: '30', labelKey: 'orders.filter.last30' },
  { value: ALL, labelKey: 'orders.filter.all' }
];

const STATUS_OPTIONS: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'SERVED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
];

/**
 * FEAT-1 Commandes board. Polls the owner order feed, groups dine-in orders by
 * table and delivery orders together, and lets staff advance statuses. New
 * orders play a chime (toggleable) and highlight until seen.
 */
export function OrdersBoard() {
  const { t } = useI18n();
  const [restaurantId, setRestaurantId] = useState<string>(ALL);
  const [scope, setScope] = useState<string>('1');
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [query, setQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Keep the latest sound preference reachable from the poll callback without
  // re-subscribing the interval on every toggle.
  const soundOnRef = useRef(soundOn);
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  // Same reason as `soundOnRef`: the poll callback is captured by the hook, so
  // reading `t` through a ref keeps the new-order toast in the language that is
  // current when the order lands rather than the one at subscribe time.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const { restaurants, printerConfigs, printerConfigsRef } =
    usePrinterConfigs();
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Held in a ref so the poll callback always prints with the current locale
  // without re-subscribing the interval.
  const ticketOptions = useTicketOptions();
  const ticketOptionsRef = useRef(ticketOptions);
  useEffect(() => {
    ticketOptionsRef.current = ticketOptions;
  }, [ticketOptions]);

  const { orders, loading, truncated, newIds, refresh, clearNew } = useOrdersPoll({
    restaurantId: restaurantId === ALL ? undefined : restaurantId,
    activeOnly: false,
    days: scope === ALL ? undefined : Number(scope),
    intervalMs: 8000,
    onNewOrder: (o) => {
      if (soundOnRef.current) playNewOrderChime();
      const tr = tRef.current;
      const where =
        o.type === 'DINE_IN'
          ? tr('orders.groupTable').replace('{label}', o.tableLabel ?? '')
          : tr('orders.delivery');
      toast.info(
        `${tr('orders.newToast').replace('{n}', String(o.orderNumber))} — ${where}`
      );
      // Auto-print the ticket when the restaurant has enabled it, but only once
      // per order across every open board, tab and device. The claim is async
      // (it hits Order.ticketPrintedAt), so fire and forget — the toast and
      // chime above have already told staff the order arrived.
      const cfg = printerConfigsRef.current.get(o.restaurantId);
      if (cfg?.autoPrint) {
        void claimAutoPrint(o.id).then((won) => {
          if (won) printOrderTicket(o, cfg, ticketOptionsRef.current);
        });
      }
    }
  });

  // Visible orders: terminal-state toggle, explicit status filter, then search.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== ALL) {
        if (o.status !== statusFilter) return false;
      } else if (
        !showCompleted &&
        (o.status === 'COMPLETED' || o.status === 'CANCELLED')
      ) {
        return false;
      }

      if (!needle) return true;
      // Order number, table, and delivery contact are what staff search by.
      const haystack = [
        String(o.orderNumber),
        `#${o.orderNumber}`,
        o.tableLabel ?? '',
        o.customerName ?? '',
        o.customerPhone ?? ''
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [orders, showCompleted, statusFilter, query]);

  // Group: dine-in by table label, delivery in one group.
  const { tableGroups, delivery } = useMemo(() => {
    const byTable = new Map<string, OrderView[]>();
    const deliveryList: OrderView[] = [];
    for (const o of visible) {
      if (o.type === 'DELIVERY') {
        deliveryList.push(o);
      } else {
        const key = o.tableLabel ?? '—';
        const arr = byTable.get(key) ?? [];
        arr.push(o);
        byTable.set(key, arr);
      }
    }
    // Sort table keys numerically when possible.
    const sortedKeys = Array.from(byTable.keys()).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    return {
      tableGroups: sortedKeys.map((k) => ({ table: k, orders: byTable.get(k)! })),
      delivery: deliveryList
    };
  }, [visible]);

  const newCount = newIds.size;
  const filtered =
    statusFilter !== ALL || query.trim().length > 0;

  return (
    <div ref={rootRef} className="fs-surface space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-2">
            <Label>{t('orders.filter.restaurant')}</Label>
            <Select value={restaurantId} onValueChange={setRestaurantId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('orders.filter.restaurant')}</SelectLabel>
                  <SelectItem value={ALL}>
                    {t('orders.filter.allRestaurants')}
                  </SelectItem>
                  {restaurants.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t('orders.filter.period')}</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('orders.filter.period')}</SelectLabel>
                  {SCOPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {t(s.labelKey)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t('orders.filter.status')}</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('orders.filter.status')}</SelectLabel>
                  <SelectItem value={ALL}>
                    {t('orders.filter.allStatuses')}
                  </SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {orderStatusLabel(s, t)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="orders-search">{t('orders.filter.search')}</Label>
            {/* Logical insets (`start-*`/`end-*`, `ps-*`/`pe-*`) instead of
                left/right: with the physical versions the search icon and the
                clear button both stayed pinned to the same side in Arabic, so the
                icon sat on top of the text. */}
            <div className="relative">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="orders-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('orders.filter.searchPlaceholder')}
                className="ps-8 pe-8"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('orders.clearSearch')}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {newCount > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-1 text-sm font-semibold text-black">
              <Bell className="h-4 w-4" />
              {/* Plural picked by key rather than appending "s": Arabic does not
                  pluralize by suffix, so the old `nouvelle{s}` could not be
                  translated at all. */}
              {t(
                newCount > 1 ? 'orders.newBadgeMany' : 'orders.newBadgeOne'
              ).replace('{n}', String(newCount))}
            </span>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
              disabled={statusFilter !== ALL}
            />
            {t('orders.showCompleted')}
          </label>
          <span className="text-sm text-muted-foreground">
            {t(
              visible.length > 1 ? 'orders.countMany' : 'orders.countOne'
            ).replace('{n}', String(visible.length))}
            {/* The server caps its result set; say so rather than showing a
                partial history as if it were complete. */}
            {truncated ? (
              <span className="ms-2 text-amber-600 dark:text-amber-500">
                {t('orders.truncated')}
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-2 md:ms-auto">
            <Button
              variant="outline"
              size="icon"
              title={soundOn ? t('orders.muteSound') : t('orders.unmuteSound')}
              onClick={() => setSoundOn((s) => !s)}
            >
              {soundOn ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <FullscreenButton target={rootRef} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="me-2 h-6 w-6 animate-spin" /> {t('orders.loading')}
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-semibold text-foreground">
            {filtered ? t('orders.emptyFiltered') : t('orders.emptyTitle')}
          </p>
          <p className="mt-2">
            {filtered ? t('orders.emptyFilteredHint') : t('orders.emptyHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Dine-in, grouped by table */}
          {tableGroups.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
                {t('orders.groupDineIn')}
              </h3>
              {tableGroups.map((grp) => (
                <div key={grp.table} className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    {t('orders.groupTable').replace('{label}', grp.table)}
                  </p>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {grp.orders.map((o) => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        isNew={newIds.has(o.id)}
                        onChanged={refresh}
                        onSeen={clearNew}
                        printerConfig={printerConfigs.get(o.restaurantId)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Delivery */}
          {delivery.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
                {t('orders.delivery')}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {delivery.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    isNew={newIds.has(o.id)}
                    onChanged={refresh}
                    onSeen={clearNew}
                    printerConfig={printerConfigs.get(o.restaurantId)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
