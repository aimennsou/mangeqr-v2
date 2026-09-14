'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Printer,
  Wallet,
  X as XIcon
} from 'lucide-react';
import type { OrderView } from '@/data/orders';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { setOrderStatus, setOrderPaid } from '@/actions/orders';
import {
  ORDER_STATUS_LABEL,
  nextStatus,
  statusBadgeClass
} from './order-status';
import { printOrderTicket } from './print-ticket';
import type { PrinterConfig } from '@/schemas';

interface OrderCardProps {
  order: OrderView;
  isNew?: boolean;
  onChanged: () => void;
  onSeen?: (id: string) => void;
  /** Per-restaurant ticket-printer config that drives "Imprimer l'addition". */
  printerConfig?: PrinterConfig | null;
}

function fmt(n: number, currency: string) {
  return (Number.isInteger(n) ? n.toString() : n.toFixed(2)) + ' ' + currency;
}

function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const h = Math.floor(mins / 60);
  return `il y a ${h} h`;
}

/**
 * A single order card (FEAT-1) — shows the order number, items (+ add-ons /
 * special requests), delivery/table context, and status controls (advance to
 * next status, or cancel). Used by both the Commandes board and the Kitchen
 * view. Highlights when `isNew`.
 */
export function OrderCard({
  order,
  isNew,
  onChanged,
  onSeen,
  printerConfig
}: OrderCardProps) {
  const [isPending, startTransition] = useTransition();

  const advanceTo = nextStatus(order.type, order.status);

  const update = (status: Parameters<typeof setOrderStatus>[0]['status']) => {
    startTransition(async () => {
      const result = await setOrderStatus({ orderId: order.id, status });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.success ?? 'Statut mis à jour.');
      onChanged();
    });
  };

  const togglePaid = () => {
    startTransition(async () => {
      const result = await setOrderPaid({ orderId: order.id, paid: !order.paid });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.success ?? 'Paiement mis à jour.');
      onChanged();
    });
  };

  const isTerminal =
    order.status === 'COMPLETED' || order.status === 'CANCELLED';

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 shadow-none transition-colors hover:border-yellow-400/60',
        isNew && 'ring-2 ring-yellow-400 animate-pulse'
      )}
      onMouseEnter={() => isNew && onSeen?.(order.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">
              #{order.orderNumber}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                statusBadgeClass(order.status)
              )}
            >
              {ORDER_STATUS_LABEL[order.status]}
            </span>
            {order.paid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300">
                <BadgeCheck className="h-3 w-3" />
                Payé
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Non payé
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeAgo(order.createdAt)}
            <span>·</span>
            <span>
              {order.type === 'DINE_IN'
                ? `Table ${order.tableLabel ?? '—'}`
                : 'Livraison'}
            </span>
          </div>
        </div>
        <span className="whitespace-nowrap text-sm font-semibold text-foreground">
          {fmt(order.total, order.currency)}
        </span>
      </div>

      {/* Delivery details */}
      {order.type === 'DELIVERY' ? (
        <div className="mt-2 space-y-0.5 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
          {order.customerName ? (
            <p className="font-medium text-foreground">{order.customerName}</p>
          ) : null}
          {order.customerPhone ? (
            <a
              href={`tel:${order.customerPhone}`}
              className="flex items-center gap-1 hover:underline"
            >
              <Phone className="h-3 w-3" /> {order.customerPhone}
            </a>
          ) : null}
          {order.address ? <p>{order.address}</p> : null}
          {order.latitude != null && order.longitude != null ? (
            <a
              href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
            >
              <MapPin className="h-3 w-3" /> Voir sur la carte
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Items */}
      <ul className="mt-3 space-y-1.5">
        {order.items.map((it) => (
          <li key={it.id} className="text-sm">
            <span className="font-medium text-foreground">
              {it.quantity}× {it.dishName}
            </span>
            {it.addons.length > 0 ? (
              <span className="text-muted-foreground">
                {' '}
                — {it.addons.map((a) => a.optionName).join(', ')}
              </span>
            ) : null}
            {it.specialRequest ? (
              <p className="text-xs italic text-muted-foreground">
                “{it.specialRequest}”
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {order.note ? (
        <p className="mt-2 rounded-md bg-muted/50 p-2 text-xs italic text-muted-foreground">
          {order.note}
        </p>
      ) : null}

      {/* Status controls */}
      {!isTerminal ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {advanceTo ? (
            <Button
              size="sm"
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={isPending}
              onClick={() => update(advanceTo)}
            >
              <ChevronRight className="mr-1 h-4 w-4" />
              {ORDER_STATUS_LABEL[advanceTo]}
            </Button>
          ) : null}
          {order.status !== 'COMPLETED' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => update('COMPLETED')}
            >
              <Check className="mr-1 h-4 w-4" />
              Terminer
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="text-red-500 hover:text-red-600"
            disabled={isPending}
            onClick={() => update('CANCELLED')}
          >
            <XIcon className="mr-1 h-4 w-4" />
            Annuler
          </Button>
        </div>
      ) : null}

      {/* Payment + ticket actions (always available, incl. terminal orders). */}
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
        <Button
          size="sm"
          variant={order.paid ? 'outline' : 'default'}
          className={cn(
            !order.paid && 'bg-green-600 text-white hover:bg-green-700'
          )}
          disabled={isPending}
          onClick={togglePaid}
        >
          <Wallet className="mr-1 h-4 w-4" />
          {order.paid ? 'Marquer non payé' : 'Marquer payé'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => printOrderTicket(order, printerConfig)}
        >
          <Printer className="mr-1 h-4 w-4" />
          Imprimer l&apos;addition
        </Button>
      </div>
    </div>
  );
}
