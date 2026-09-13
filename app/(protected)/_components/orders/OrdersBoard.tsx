'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Loader2, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import type { OrderView } from '@/data/orders';

import { Button } from '@/components/ui/button';
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
import { OrderCard } from './OrderCard';
import { playNewOrderChime } from './notify';

const ALL = '__all__';

/**
 * FEAT-1 Commandes board. Polls the owner order feed, groups dine-in orders by
 * table and delivery orders together, and lets staff advance statuses. New
 * orders play a chime (toggleable) and highlight until seen.
 */
export function OrdersBoard() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>(ALL);
  const [showCompleted, setShowCompleted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const soundOnRef = useState({ current: true })[0];
  soundOnRef.current = soundOn;

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
    activeOnly: false,
    intervalMs: 8000,
    onNewOrder: (o) => {
      if (soundOnRef.current) playNewOrderChime();
      toast.info(
        `Nouvelle commande #${o.orderNumber} — ${
          o.type === 'DINE_IN' ? `Table ${o.tableLabel ?? ''}` : 'Livraison'
        }`
      );
    }
  });

  // Visible orders (optionally hiding terminal ones).
  const visible = useMemo(
    () =>
      showCompleted
        ? orders
        : orders.filter(
            (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
          ),
    [orders, showCompleted]
  );

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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="grid w-full gap-2 md:max-w-xs">
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

        <div className="flex items-center gap-4 md:ml-auto">
          {newCount > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-1 text-sm font-semibold text-black">
              <Bell className="h-4 w-4" />
              {newCount} nouvelle{newCount > 1 ? 's' : ''}
            </span>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
            Afficher terminées
          </label>
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
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Chargement...
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-semibold">Aucune commande en cours.</p>
          <p className="mt-2">
            Les nouvelles commandes des clients apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Dine-in, grouped by table */}
          {tableGroups.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">
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
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">
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
