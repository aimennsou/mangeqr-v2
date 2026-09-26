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
import { ORDER_STATUS_LABEL } from './order-status';

const ALL = '__all__';

/**
 * Rolling time windows for the feed. Defaults to today so the board shows a
 * bounded, meaningful list — it used to request every order ever placed and let
 * the server's `take: 200` truncate it silently.
 */
const SCOPES = [
  { value: '1', labelKey: "Aujourd'hui" },
  { value: '7', labelKey: '7 derniers jours' },
  { value: '30', labelKey: '30 derniers jours' },
  { value: ALL, labelKey: 'Tout' }
] as const;

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
      toast.info(
        `Nouvelle commande #${o.orderNumber} — ${
          o.type === 'DINE_IN' ? `Table ${o.tableLabel ?? ''}` : 'Livraison'
        }`
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
            <Label>Restaurant</Label>
            <Select value={restaurantId} onValueChange={setRestaurantId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Restaurant</SelectLabel>
                  <SelectItem value={ALL}>Tous les restaurants</SelectItem>
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
            <Label>Période</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Période</SelectLabel>
                  {SCOPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.labelKey}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Statut</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Statut</SelectLabel>
                  <SelectItem value={ALL}>Tous les statuts</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ORDER_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="orders-search">Rechercher</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="orders-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="N°, table, client, téléphone"
                className="pl-8 pr-8"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Effacer la recherche"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              {newCount} nouvelle{newCount > 1 ? 's' : ''}
            </span>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
              disabled={statusFilter !== ALL}
            />
            Afficher terminées
          </label>
          <span className="text-sm text-muted-foreground">
            {visible.length} commande{visible.length > 1 ? 's' : ''}
            {/* The server caps its result set; say so rather than showing a
                partial history as if it were complete. */}
            {truncated ? (
              <span className="ms-2 text-amber-600 dark:text-amber-500">
                (les plus récentes — affinez la période pour voir le reste)
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-2 md:ml-auto">
            <Button
              variant="outline"
              size="icon"
              title={soundOn ? 'Couper le son' : 'Activer le son'}
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
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Chargement...
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-semibold text-foreground">
            {filtered
              ? 'Aucune commande ne correspond aux filtres.'
              : 'Aucune commande en cours.'}
          </p>
          <p className="mt-2">
            {filtered
              ? 'Modifiez la période, le statut ou la recherche.'
              : 'Les nouvelles commandes des clients apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Dine-in, grouped by table */}
          {tableGroups.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
                Sur place
              </h3>
              {tableGroups.map((grp) => (
                <div key={grp.table} className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Table {grp.table}
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
                Livraison
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
