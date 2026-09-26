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
import { ORDER_STATUS_LABEL, statusBadgeClass } from './order-status';
import FullscreenButton from '../FullscreenButton';

const ALL = '__all__';

// Kitchen columns: the active pipeline (terminal states are excluded server-side
// via activeOnly). READY groups both dine-in-ready and delivery-ready; the
// dispatch/serve step is handled from the card actions.
const COLUMNS: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'OUT_FOR_DELIVERY'
];

// Handed off to the floor / the driver: still "active" for the order feed, but
// the kitchen has nothing left to do on them. They used to be folded into the
// READY column, so served dine-in orders piled up under "Prête" until somebody
// pressed "Terminer".
const HANDED_OFF: OrderStatus[] = ['SERVED', 'DELIVERED'];

/**
 * FEAT-1 Kitchen board (D17). Active orders laid out in status columns for a
 * quick station view. Owner + members. Polls + chimes on new orders.
 */
export function KitchenBoard() {
  const [restaurantId, setRestaurantId] = useState<string>(ALL);
  const [soundOn, setSoundOn] = useState(true);

  // Keep the latest sound preference reachable from the poll callback without
  // re-subscribing the interval on every toggle.
  const soundRef = useRef(soundOn);
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

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
      toast.info(`Nouvelle commande #${o.orderNumber}`);
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
        <div className="flex items-center gap-2 sm:ml-auto">
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

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Chargement...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                  <span>{ORDER_STATUS_LABEL[col]}</span>
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
