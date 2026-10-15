'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { resolvePrinterConfig, type PrinterConfig } from '@/schemas';

/**
 * The subset of `/api/magasin` we actually consume on the order boards. That
 * endpoint returns whole Restaurant rows; both boards previously typed it as
 * `any[]` and read `printerConfig` off it untyped.
 */
export interface OrderBoardRestaurant {
  id: string;
  name: string;
  printerConfig: unknown;
}

function isRestaurantRow(value: unknown): value is OrderBoardRestaurant {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.name === 'string';
}

/**
 * Load the workspace's restaurants and derive a `restaurantId -> PrinterConfig`
 * map, so every ticket prints with its own restaurant's layout and auto-print
 * respects the per-restaurant setting.
 *
 * Shared by `OrdersBoard` and `KitchenBoard` (they had identical copies of this
 * fetch + memo). Also returns a ref to the map, because the poll's `onNewOrder`
 * callback needs the latest configs without re-subscribing the interval.
 */
export function usePrinterConfigs() {
  const [restaurants, setRestaurants] = useState<OrderBoardRestaurant[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/magasin');
        const data: unknown = res.ok ? await res.json() : [];
        if (!active) return;
        setRestaurants(
          Array.isArray(data)
            ? data.filter(isRestaurantRow).map((r) => ({
                id: r.id,
                name: r.name,
                printerConfig: r.printerConfig ?? null
              }))
            : []
        );
      } catch {
        if (active) setRestaurants([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const printerConfigs = useMemo(() => {
    const map = new Map<string, PrinterConfig>();
    for (const r of restaurants) {
      // resolvePrinterConfig merges the stored JSON over the defaults, so a
      // malformed/partial stored value still yields a usable config.
      map.set(r.id, resolvePrinterConfig(r.printerConfig ?? null));
    }
    return map;
  }, [restaurants]);

  const printerConfigsRef = useRef(printerConfigs);
  useEffect(() => {
    printerConfigsRef.current = printerConfigs;
  }, [printerConfigs]);

  return { restaurants, printerConfigs, printerConfigsRef };
}
