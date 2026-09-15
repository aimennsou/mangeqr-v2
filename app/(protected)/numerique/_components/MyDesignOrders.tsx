'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import {
  Check,
  Clock,
  Hammer,
  Loader2,
  Package,
  Truck,
  XCircle,
  RefreshCcw
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PHYSICAL_MENU_PRODUCTS } from '@/config';

/** Which family of orders to show. QR = physical QR-code supports; physical =
 * printed menu runs; all = both. */
export type OrderKind = 'all' | 'qr' | 'physical';

const PHYSICAL_IDS = new Set(PHYSICAL_MENU_PRODUCTS.map((p) => p.id));

type Status =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

interface DesignOrder {
  id: string;
  restaurantId: string;
  restaurantName: string | null;
  designId: string;
  designName: string;
  quantity: number;
  status: Status;
  deliveryMethod: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABEL: Record<Status, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée'
};

// The fulfillment lifecycle steps a user can follow (Cancelled is handled
// separately as a terminal, off-track state).
const STEPS: { key: Status; label: string; icon: typeof Clock }[] = [
  { key: 'PENDING', label: 'En attente', icon: Clock },
  { key: 'IN_PROGRESS', label: 'En cours', icon: Hammer },
  { key: 'SHIPPED', label: 'Expédiée', icon: Truck },
  { key: 'DELIVERED', label: 'Livrée', icon: Check }
];

function statusBadgeVariant(
  status: Status
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' {
  switch (status) {
    case 'DELIVERED':
      return 'success';
    case 'SHIPPED':
      return 'default';
    case 'IN_PROGRESS':
      return 'secondary';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/** Horizontal progress tracker for a single order's status. */
function StatusTracker({ status }: { status: Status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        <XCircle className="h-4 w-4" />
        Commande annulée
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
                  done &&
                    'border-yellow-400 bg-yellow-400 text-black',
                  current &&
                    'border-yellow-400 bg-yellow-400/15 text-yellow-600 dark:text-yellow-500',
                  !done &&
                    !current &&
                    'border-border bg-muted text-muted-foreground'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-[11px]',
                  current
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <span
                className={cn(
                  'mx-1 mb-5 h-0.5 flex-1 rounded-full transition-colors',
                  i < currentIndex ? 'bg-yellow-400' : 'bg-border'
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * "Mes commandes" — read-only tracking of the workspace owner's design orders
 * (QR-code supports and printed physical menus). Diners never see this; it's
 * the restaurateur's mirror of the superadmin fulfillment console: they submit
 * an order, then follow its status here (En attente → En cours → Expédiée →
 * Livrée).
 */
interface MyDesignOrdersProps {
  /** Restrict the list to a family of orders. Defaults to 'all'. */
  kind?: OrderKind;
  /** Optional header overrides (per host page). */
  title?: string;
  description?: string;
  /** Optional empty-state text overrides. */
  emptyTitle?: string;
  emptySubtitle?: string;
}

export default function MyDesignOrders({
  kind = 'all',
  title = 'Mes commandes',
  description = 'Suivez le statut de fabrication et de livraison de vos commandes de QR codes et menus imprimés.',
  emptyTitle = 'Aucune commande pour le moment.',
  emptySubtitle = 'Commandez un design de QR code ou un menu imprimé pour suivre son statut ici.'
}: MyDesignOrdersProps = {}) {
  const { theme } = useTheme();
  const [orders, setOrders] = useState<DesignOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/design-orders', { cache: 'no-store' });
      const data = res.ok ? await res.json() : { orders: [] };
      const all: DesignOrder[] = Array.isArray(data.orders) ? data.orders : [];
      const filtered =
        kind === 'physical'
          ? all.filter((o) => PHYSICAL_IDS.has(o.designId))
          : kind === 'qr'
            ? all.filter((o) => !PHYSICAL_IDS.has(o.designId))
            : all;
      setOrders(filtered);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        <div className="flex justify-center">
          <Image
            className={theme === 'dark' ? 'dark:invert' : ''}
            src="/images/empty-numerique.png"
            alt="Aucune commande"
            width={360}
            height={360}
            priority
          />
        </div>
        <p className="mt-4 text-lg font-semibold text-foreground">
          {emptyTitle}
        </p>
        <p className="mt-2 text-sm">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif-display text-2xl font-light tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          className="shrink-0"
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Actualiser
        </Button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                  <Package className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    {order.designName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.restaurantName ?? '—'} · Qté {order.quantity} ·
                    Commandé le {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
              <Badge variant={statusBadgeVariant(order.status)}>
                {STATUS_LABEL[order.status]}
              </Badge>
            </div>

            <div className="pt-5">
              <StatusTracker status={order.status} />
            </div>

            {(order.deliveryMethod || order.notes) && (
              <div className="mt-4 space-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
                {order.deliveryMethod ? (
                  <p>
                    <span className="font-medium text-foreground">
                      Livraison :
                    </span>{' '}
                    {order.deliveryMethod}
                  </p>
                ) : null}
                {order.notes ? (
                  <p>
                    <span className="font-medium text-foreground">Notes :</span>{' '}
                    {order.notes}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
