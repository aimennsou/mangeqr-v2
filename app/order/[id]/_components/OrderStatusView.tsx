'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

type OrderStatus =
  | 'RECEIVED'
  | 'IN_PREPARATION'
  | 'READY'
  | 'SERVED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

interface OrderData {
  id: string;
  orderNumber: number;
  type: 'DINE_IN' | 'DELIVERY';
  status: OrderStatus;
  tableLabel: string | null;
  total: number;
  createdAt: string;
  restaurant: { name: string; currency: string };
  items: {
    id: string;
    dishName: string;
    quantity: number;
    lineTotal: number;
    addons: { groupName: string; optionName: string; priceDelta: number }[] | null;
    specialRequest: string | null;
  }[];
}

// The status flow per order type — used to render a progress stepper.
const DINE_IN_FLOW: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'SERVED',
  'COMPLETED'
];
const DELIVERY_FLOW: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED'
];

/**
 * Diner live order-tracking view (FEAT-1). Polls GET /api/orders/[id] every 8s
 * and renders a status stepper + the order summary. Uses the app i18n so status
 * labels are localized. Best-effort polling; stops on terminal states.
 */
export function OrderStatusView({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const tr = (key: string) => t(key as TranslationKey);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          cache: 'no-store'
        });
        if (!active) return;
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (res.ok) {
          const data: OrderData = await res.json();
          setOrder(data);
          // Stop polling once the order reaches a terminal state.
          if (
            (data.status === 'COMPLETED' ||
              data.status === 'DELIVERED' ||
              data.status === 'CANCELLED') &&
            timer.current
          ) {
            clearInterval(timer.current);
            timer.current = null;
          }
        }
      } catch {
        /* best-effort polling */
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrder();
    timer.current = setInterval(fetchOrder, 8000);
    return () => {
      active = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [orderId]);

  const fmt = (n: number, currency: string) =>
    (Number.isInteger(n) ? n.toString() : n.toFixed(2)) + ' ' + currency;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <p className="text-muted-foreground">{tr('order.notFound')}</p>
      </div>
    );
  }

  const flow = order.type === 'DELIVERY' ? DELIVERY_FLOW : DINE_IN_FLOW;
  const isCancelled = order.status === 'CANCELLED';
  const currentIdx = flow.indexOf(order.status);

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {order.restaurant.name}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {tr('order.orderNumber')} #{order.orderNumber}
          </h1>
          {order.type === 'DINE_IN' && order.tableLabel ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {tr('order.chooseTable')}: {order.tableLabel}
            </p>
          ) : null}
        </div>

        {/* Status stepper */}
        {isCancelled ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-950/40">
            <XCircle className="h-8 w-8" />
            <span className="font-semibold">
              {tr('order.status.CANCELLED')}
            </span>
          </div>
        ) : (
          <ol className="mt-6 space-y-3">
            {flow.map((step, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full ' +
                      (done || active
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground')
                    }
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : active ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <span className="text-xs">{i + 1}</span>
                    )}
                  </span>
                  <span
                    className={
                      'text-sm ' +
                      (active
                        ? 'font-semibold text-foreground'
                        : done
                        ? 'text-foreground'
                        : 'text-muted-foreground')
                    }
                  >
                    {tr(`order.status.${step}`)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {/* Order summary */}
        <div className="mt-6 border-t pt-4">
          <ul className="space-y-2">
            {order.items.map((it) => (
              <li key={it.id} className="text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground">
                    {it.quantity}× {it.dishName}
                  </span>
                  <span className="text-muted-foreground">
                    {fmt(it.lineTotal, order.restaurant.currency)}
                  </span>
                </div>
                {it.addons && it.addons.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {it.addons.map((a) => a.optionName).join(', ')}
                  </p>
                ) : null}
                {it.specialRequest ? (
                  <p className="text-xs italic text-muted-foreground">
                    “{it.specialRequest}”
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t pt-3 text-base font-semibold">
            <span>{tr('order.total')}</span>
            <span>{fmt(order.total, order.restaurant.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
