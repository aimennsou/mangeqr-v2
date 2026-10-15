'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { OrderStatus } from '@prisma/client';
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useOrdersPoll } from './useOrdersPoll';
import { usePrinterConfigs } from './usePrinterConfigs';
import { useTicketOptions } from './useTicketStrings';
import { OrderCard } from './OrderCard';
import { printOrderTicket } from './print-ticket';
import { claimAutoPrint } from './print-dedupe';
import { playNewOrderChime } from './notify';
import { orderStatusLabel, statusBadgeClass } from './order-status';
import FullscreenButton from '../FullscreenButton';
import { useI18n } from '@/lib/i18n';

const ALL = '__all__';

// Kitchen columns. The board STOPS AT "Prête" on purpose: once food leaves the
// pass the kitchen has nothing left to do with it, whether a server carries it to
// a table or a driver takes it out. There used to be an "En livraison" column
// here, which put a delivery-only concern on the kitchen screen and sat
// permanently empty for restaurants that don't deliver.
//
// Everything after READY — serving, dispatching, delivering — is tracked on the
// Commandes board instead. Terminal states are already excluded server-side via
// activeOnly.
const COLUMNS: OrderStatus[] = ['RECEIVED', 'IN_PREPARATION', 'READY'];

// Out of the kitchen's hands: still "active" in the order feed, but done as far
// as the pass is concerned, so they leave this board rather than sitting in a
// column forever. OUT_FOR_DELIVERY joined this list when the delivery column was
// removed.
const HANDED_OFF: OrderStatus[] = [
  'SERVED',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
];

/**
 * FEAT-1 Kitchen board (D17). Active orders laid out in status columns for a
 * quick station view. Owner + members. Polls + chimes on new orders.
 */
export function KitchenBoard() {
  const { t } = useI18n();
  const [restaurantId, setRestaurantId] = useState<string>(ALL);
  const [soundOn, setSoundOn] = useState(true);

  // Keep the latest sound preference reachable from the poll callback without
  // re-subscribing the interval on every toggle.
  const soundRef = useRef(soundOn);
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  // Likewise for the translator: the poll callback is captured, so the new-order
  // toast reads `t` through a ref to follow a language switch.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const { restaurants, printerConfigs, printerConfigsRef } =
    usePrinterConfigs();
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Held in a ref so the poll callback always prints with the current locale.
  const ticketOptions = useTicketOptions();
  const ticketOptionsRef = useRef(ticketOptions);
  useEffect(() => {
    ticketOptionsRef.current = ticketOptions;
  }, [ticketOptions]);

  const { orders, loading, newIds, refresh, clearNew } = useOrdersPoll({
    restaurantId: restaurantId === ALL ? undefined : restaurantId,
    activeOnly: true,
    // The kitchen only ever cares about the current service.
    days: 1,
    intervalMs: 6000,
    onNewOrder: (o) => {
      if (soundRef.current) playNewOrderChime();
      toast.info(
        tRef.current('orders.newToast').replace('{n}', String(o.orderNumber))
      );
      // One ticket per order across every board, tab and device — the claim is
      // an atomic UPDATE on Order.ticketPrintedAt, so Commandes and Cuisine
      // being open at once can no longer each produce a ticket.
      const cfg = printerConfigsRef.current.get(o.restaurantId);
      if (cfg?.autoPrint) {
        void claimAutoPrint(o.id).then((won) => {
          if (won) printOrderTicket(o, cfg, ticketOptionsRef.current);
        });
      }
    }
  });

  const byColumn = useMemo(() => {
    const map = new Map<OrderStatus, typeof orders>();
    COLUMNS.forEach((c) => map.set(c, []));
    for (const o of orders) {
      // Already served / delivered: out of the kitchen's hands, so it leaves the
      // board rather than sitting in a column forever.
      if (HANDED_OFF.includes(o.status)) continue;
      const col = map.has(o.status) ? o.status : 'RECEIVED';
      map.get(col)!.push(o);
    }
    return map;
  }, [orders]);

  return (
    <div
      ref={rootRef}
      className="fs-surface space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="grid w-full gap-2 sm:max-w-xs">
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
        <div className="flex items-center gap-2 sm:ms-auto">
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

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="me-2 h-6 w-6 animate-spin" /> {t('orders.loading')}
        </div>
      ) : (
        // 3 columns, matching COLUMNS. Was xl:grid-cols-4 for the removed
        // delivery column, which would now leave a dead gap on wide screens.
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {COLUMNS.map((col) => {
            const list = byColumn.get(col) ?? [];
            return (
              <div key={col} className="flex flex-col gap-3">
                <div
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold',
                    statusBadgeClass(col)
                  )}
                >
                  <span>{orderStatusLabel(col, t)}</span>
                  <span className="tabular-nums">{list.length}</span>
                </div>
                <div className="space-y-3">
                  {list.length === 0 ? (
                    <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                      —
                    </p>
                  ) : (
                    list.map((o) => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        isNew={newIds.has(o.id)}
                        onChanged={refresh}
                        onSeen={clearNew}
                        printerConfig={printerConfigs.get(o.restaurantId)}
                        context="kitchen"
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
