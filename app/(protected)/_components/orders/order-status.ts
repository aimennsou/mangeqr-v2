import type { OrderStatus, OrderType } from '@prisma/client';

/**
 * Shared client-side order-status helpers for the owner Commandes + Kitchen
 * views (FEAT-1). French labels + the per-type status flow + badge styling.
 */

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: 'Reçue',
  IN_PREPARATION: 'En préparation',
  READY: 'Prête',
  SERVED: 'Servie',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée'
};

// Ordered status pipeline per type (used to render the "advance" action).
export const DINE_IN_FLOW: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'SERVED',
  'COMPLETED'
];
export const DELIVERY_FLOW: OrderStatus[] = [
  'RECEIVED',
  'IN_PREPARATION',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED'
];

export function flowForType(type: OrderType): OrderStatus[] {
  return type === 'DELIVERY' ? DELIVERY_FLOW : DINE_IN_FLOW;
}

/** The next status in the flow after `status`, or null if terminal/unknown. */
export function nextStatus(
  type: OrderType,
  status: OrderStatus
): OrderStatus | null {
  const flow = flowForType(type);
  const idx = flow.indexOf(status);
  if (idx < 0 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

export function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case 'RECEIVED':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300';
    case 'IN_PREPARATION':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
    case 'READY':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300';
    case 'OUT_FOR_DELIVERY':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300';
    case 'SERVED':
    case 'DELIVERED':
    case 'COMPLETED':
      return 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}
