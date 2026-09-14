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
import { resolvePrinterConfig, type PrinterConfig } from '@/schemas';
import { useOrdersPoll } from './useOrdersPoll';
import { OrderCard } from './OrderCard';
import { printOrderTicket } from './print-ticket';
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

/**
 * FEAT-1 Kitchen board (D17). Active orders laid out in status columns for a
 * quick station view. Owner + members. Polls + chimes on new orders.
 */
export function KitchenBoard() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>(ALL);
  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useState({ current: true })[0];
  soundRef.current = soundOn;

  // Map restaurantId -> saved printer config (drives per-ticket layout +
  // auto-print on new orders).
  const printerConfigs = useMemo(() => {
    const m = new Map<string, PrinterConfig>();
    for (const r of restaurants) {
      if (r?.id) m.set(r.id, resolvePrinterConfig(r.printerConfig ?? null));
    }
    return m;
  }, [restaurants]);
  const printerConfigsRef = useRef(printerConfigs);
  printerConfigsRef.current = printerConfigs;
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/magasin');
        const data = res.ok ? await res.json() : [];
        setRestaurants(Array.isArray(data) ? data : []);
      } catch {
        setRestaurants([]);
      }
    })();
  }, []);

  const { orders, loading, newIds, refresh, clearNew } = useOrdersPoll({
    restaurantId: restaurantId === ALL ? undefined : restaurantId,
    activeOnly: true,
    intervalMs: 6000,
    onNewOrder: (o) => {
      if (soundRef.current) playNewOrderChime();
      toast.info(`Nouvelle commande #${o.orderNumber}`);
      const cfg = printerConfigsRef.current.get(o.restaurantId);
      if (cfg?.autoPrint) printOrderTicket(o, cfg);
    }
  });

  const byColumn = useMemo(() => {
    const map = new Map<OrderStatus, typeof orders>();
    COLUMNS.forEach((c) => map.set(c, []));
    for (const o of orders) {
      // SERVED/DELIVERED are active-but-done-in-kitchen; fold them into READY's
      // column tail is unnecessary — activeOnly still returns them, so bucket
      // any status not in COLUMNS under READY for visibility.
      const col = map.has(o.status) ? o.status : 'READY';
      map.get(col)!.push(o);
    }
    return map;
  }, [orders]);

  return (
    <div
      ref={rootRef}
      className="space-y-6 [&:fullscreen]:overflow-auto [&:fullscreen]:bg-background [&:fullscreen]:p-6"
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
