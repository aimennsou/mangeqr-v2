import type { OrderStatus } from '@prisma/client';

/**
 * Presentation-only order-status helpers for the owner Commandes + Kitchen
 * views (FEAT-1): French labels + badge styling.
 *
 * The lifecycle itself (flows, next step, transition legality) lives in
 * `@/lib/order-flow` and is re-exported here so existing imports keep working
 * while there is only one definition of the flow.
 */

export {
  DINE_IN_FLOW,
  DELIVERY_FLOW,
  flowForType,
  nextStatus,
  isTerminal,
  isTransitionAllowed
} from '@/lib/order-flow';

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
