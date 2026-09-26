'use client';

import { useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Printer,
  RotateCcw,
  Wallet,
  X as XIcon
} from 'lucide-react';
import type { OrderView } from '@/data/orders';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { setOrderStatus, setOrderPaid } from '@/actions/orders';
import {
  orderStatusLabel,
  REOPEN_STATUS,
  canReopen,
  nextStatus,
  statusBadgeClass
} from './order-status';
import { printOrderTicket } from './print-ticket';
import { useTicketOptions } from './useTicketStrings';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import type { PrinterConfig } from '@/schemas';

interface OrderCardProps {
  order: OrderView;
  isNew?: boolean;
  onChanged: () => void;
  onSeen?: (id: string) => void;
  /** Per-restaurant ticket-printer config that drives "Imprimer l'addition". */
  printerConfig?: PrinterConfig | null;
  /**
   * Where this card is rendered. The kitchen board stops caring about an order
   * once it leaves the pass, so on `'kitchen'` the card hides the dispatch step
   * (READY -> OUT_FOR_DELIVERY): dispatching and delivery tracking belong to the
   * Commandes board. Without this the kitchen still offered "En livraison", which
   * is a delivery concern on a kitchen screen.
   */
  context?: 'orders' | 'kitchen';
}

/**
 * How long a new-order highlight survives without any staff interaction. Bounds
 * the "N nouvelles" badge so it can't accumulate across a whole service on an
 * unattended kitchen display.
 */
const NEW_HIGHLIGHT_MS = 60_000;

function fmt(n: number, currency: string) {
  return (Number.isInteger(n) ? n.toString() : n.toFixed(2)) + ' ' + currency;
}

/**
 * Relative age of an order ("il y a 12 min").
 *
 * Takes the translator rather than formatting French inline: this string sits
 * on every card of the Commandes and Cuisine boards, so hardcoding it left two
 * whole screens French under an Arabic UI. The dictionary entries carry an `{n}`
 * placeholder so each language keeps its own word order.
 */
function timeAgo(date: Date | string, t: (key: TranslationKey) => string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return t('orders.justNow');
  if (mins < 60) return t('orders.minsAgo').replace('{n}', String(mins));
  const h = Math.floor(mins / 60);
  return t('orders.hoursAgo').replace('{n}', String(h));
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
  printerConfig,
  context = 'orders'
}: OrderCardProps) {
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();
  const ticketOptions = useTicketOptions();

  // Acknowledging a new order used to be bound to onMouseEnter only, so on the
  // touch screens these boards are designed for the pulsing ring and the
  // "N nouvelles" badge never cleared. Auto-expire the highlight as a backstop
  // for an unattended screen (the chime has already alerted by then).
  useEffect(() => {
    if (!isNew) return;
    const timer = setTimeout(() => onSeen?.(order.id), NEW_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [isNew, onSeen, order.id]);

  const acknowledge = () => {
    if (isNew) onSeen?.(order.id);
  };

  const nextInFlow = nextStatus(order.type, order.status);
  // On the kitchen board, don't offer the dispatch step. A delivery order that is
  // READY is finished as far as the pass goes; a driver is assigned from
  // Commandes. Suppressing it here is what keeps delivery tracking out of the
  // kitchen entirely (the "En livraison" column was removed for the same reason).
  const advanceTo =
    context === 'kitchen' && nextInFlow === 'OUT_FOR_DELIVERY'
      ? null
      : nextInFlow;

  const update = (status: Parameters<typeof setOrderStatus>[0]['status']) => {
    startTransition(async () => {
      const result = await setOrderStatus({ orderId: order.id, status });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      // Deliberately ignores `result.success`: the server action only speaks
      // French, so echoing it would put a French toast on an Arabic screen.
      toast.success(t('orders.statusUpdated'));
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
      toast.success(t('orders.paymentUpdated'));
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
      // pointerdown covers touch and pen as well as mouse, so tapping a card on
      // a tablet acknowledges it just like hovering does with a mouse.
      onMouseEnter={acknowledge}
      onPointerDown={acknowledge}
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
              {orderStatusLabel(order.status, t)}
            </span>
            {order.paid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-300">
                <BadgeCheck className="h-3 w-3" />
                {t('orders.paid')}
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {t('orders.notPaid')}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeAgo(order.createdAt, t)}
            <span>·</span>
            <span>
              {order.type === 'DINE_IN'
                ? t('orders.groupTable').replace(
                    '{label}',
                    order.tableLabel ?? '—'
                  )
                : t('orders.delivery')}
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
              <MapPin className="h-3 w-3" /> {t('orders.viewOnMap')}
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
              {/* `me-1` (margin-inline-end), not `mr-1`: in Arabic the icon sits
                  to the right of the label, so a physical right margin opened a
                  gap on the wrong side. Same for every icon button below. */}
              <ChevronRight className="me-1 h-4 w-4 rtl:rotate-180" />
              {orderStatusLabel(advanceTo, t)}
            </Button>
          ) : null}
          {order.status !== 'COMPLETED' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => update('COMPLETED')}
            >
              <Check className="me-1 h-4 w-4" />
              {t('orders.complete')}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="text-red-500 hover:text-red-600"
            disabled={isPending}
            onClick={() => update('CANCELLED')}
          >
            <XIcon className="me-1 h-4 w-4" />
            {t('orders.cancel')}
          </Button>
        </div>
      ) : canReopen(order.status) ? (
        /* Undo an accidental cancellation. Cancelling is one tap on a busy pass
           and used to be permanent — staff had to make the diner order again,
           which also burned a second order number. COMPLETED gets no such
           button: it is the accounting close. */
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => update(REOPEN_STATUS)}
          >
            <RotateCcw className="me-1 h-4 w-4" />
            {t('orders.reopen')}
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
          <Wallet className="me-1 h-4 w-4" />
          {order.paid ? t('orders.markNotPaid') : t('orders.markPaid')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Surface a failed print: a blocked/unavailable print path used to
            // fail silently, which is indistinguishable from a paper jam.
            const result = printOrderTicket(order, printerConfig, ticketOptions);
            if (result !== 'printed') {
              toast.error(t('printer.ticket.blocked'));
            }
          }}
        >
          <Printer className="me-1 h-4 w-4" />
          {t('orders.printBill')}
        </Button>
      </div>
    </div>
  );
}
