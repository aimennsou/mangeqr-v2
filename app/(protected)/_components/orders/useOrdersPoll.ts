'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { OrderView } from '@/data/orders';

/**
 * Poll the owner order feed (FEAT-1). Fetches /api/owner-orders every
 * `intervalMs`, tracks the set of known order ids, and fires `onNewOrder` when
 * a NEW order id appears after the first load (so staff get a sound + visual
 * alert). Returns the current orders, a loading flag, and the count of orders
 * that arrived since mount (for a badge).
 */
export function useOrdersPoll(opts: {
  restaurantId?: string;
  activeOnly?: boolean;
  intervalMs?: number;
  onNewOrder?: (order: OrderView) => void;
}) {
  const { restaurantId, activeOnly = false, intervalMs = 8000, onNewOrder } = opts;
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  // Ids of newly-arrived orders (since mount), so the UI can highlight them.
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const knownIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);
  const onNewOrderRef = useRef(onNewOrder);
  onNewOrderRef.current = onNewOrder;

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (restaurantId) params.set('restaurantId', restaurantId);
      if (activeOnly) params.set('activeOnly', '1');
      const res = await fetch(`/api/owner-orders?${params.toString()}`, {
        cache: 'no-store'
      });
      if (!res.ok) return;
      const data: { orders: OrderView[] } = await res.json();
      const list = data.orders ?? [];

      // Detect new orders (ids not seen before). Skip on the very first load so
      // we don't alert for the existing backlog.
      if (!firstLoad.current) {
        const fresh = list.filter((o) => !knownIds.current.has(o.id));
        if (fresh.length > 0) {
          setNewIds((prev) => {
            const next = new Set(prev);
            fresh.forEach((o) => next.add(o.id));
            return next;
          });
          fresh.forEach((o) => onNewOrderRef.current?.(o));
        }
      }
      list.forEach((o) => knownIds.current.add(o.id));
      firstLoad.current = false;

      setOrders(list);
    } catch {
      /* best-effort polling */
    } finally {
      setLoading(false);
    }
  }, [restaurantId, activeOnly]);

  useEffect(() => {
    // Reset detection state when the scope changes.
    knownIds.current = new Set();
    firstLoad.current = true;
    setNewIds(new Set());
    setLoading(true);
    fetchOrders();
    const timer = setInterval(fetchOrders, intervalMs);
    return () => clearInterval(timer);
  }, [fetchOrders, intervalMs]);

  const clearNew = useCallback((id: string) => {
    setNewIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return { orders, loading, newIds, refresh: fetchOrders, clearNew };
}
