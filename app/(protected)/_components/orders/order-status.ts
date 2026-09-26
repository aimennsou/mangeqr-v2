import type { OrderStatus } from '@prisma/client';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

/**
 * Presentation-only order-status helpers for the owner Commandes + Kitchen
 * views (FEAT-1): localized labels + badge styling.
 *
 * The lifecycle itself (flows, next step, transition legality) lives in
 * `@/lib/order-flow` and is re-exported here so existing imports keep working
 * while there is only one definition of the flow.
 */

export {
  DINE_IN_FLOW,
  DELIVERY_FLOW,
  REOPEN_STATUS,
  canReopen,
  flowForType,
  nextStatus,
  isTerminal,
  isTransitionAllowed
} from '@/lib/order-flow';

/**
 * Localized label for an order status.
 *
 * This used to be a module-scope `Record<OrderStatus, string>` of French
 * strings. A module-scope constant is evaluated once, before any provider
 * exists, so it could never react to a language switch — the Commandes,
 * Cuisine and Plan-de-salle screens stayed French even in Arabic. Taking `t`
 * as a parameter makes the label resolve per render instead.
 *
 * The `switch` is deliberate: it keeps every key literal so `TranslationKey`
 * still checks them at compile time, and an added `OrderStatus` member fails
 * the exhaustiveness check rather than silently rendering a raw enum name.
 */
export function orderStatusLabel(
  status: OrderStatus,
  t: (key: TranslationKey) => string
): string {
  switch (status) {
    case 'RECEIVED':
      return t('orders.status.RECEIVED');
    case 'IN_PREPARATION':
      return t('orders.status.IN_PREPARATION');
    case 'READY':
      return t('orders.status.READY');
    case 'SERVED':
      return t('orders.status.SERVED');
    case 'OUT_FOR_DELIVERY':
      return t('orders.status.OUT_FOR_DELIVERY');
    case 'DELIVERED':
      return t('orders.status.DELIVERED');
    case 'COMPLETED':
      return t('orders.status.COMPLETED');
    case 'CANCELLED':
      return t('orders.status.CANCELLED');
    default:
      return status;
  }
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
