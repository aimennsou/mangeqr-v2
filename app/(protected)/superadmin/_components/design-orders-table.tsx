'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Search, Package } from 'lucide-react';
import { DesignOrderStatus } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { SuperadminDesignOrderRow } from '@/data/superadmin';
import { superadminSetDesignOrderStatus } from '@/actions/superadmin';

interface DesignOrdersTableProps {
  initialOrders: SuperadminDesignOrderRow[];
  initialTotal: number;
  pageSize: number;
}

/** FR status labels + badge variants for the fulfillment lifecycle. */
const STATUS_LABEL: Record<DesignOrderStatus, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée'
};

function statusBadgeVariant(
  status: DesignOrderStatus
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

/** Ordered list of statuses for the filter + per-row selector. */
const STATUS_ORDER: DesignOrderStatus[] = [
  DesignOrderStatus.PENDING,
  DesignOrderStatus.IN_PROGRESS,
  DesignOrderStatus.SHIPPED,
  DesignOrderStatus.DELIVERED,
  DesignOrderStatus.CANCELLED
];

const ALL_STATUSES = 'ALL';

function formatDate(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function DesignOrdersTable({
  initialOrders,
  initialTotal,
  pageSize
}: DesignOrdersTableProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<SuperadminDesignOrderRow[]>(
    initialOrders
  );
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Which row is mid status-update (to disable just that selector).
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (nextSkip: number, nextSearch: string, nextStatus: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          skip: String(nextSkip),
          take: String(pageSize)
        });
        if (nextSearch.trim()) params.set('search', nextSearch.trim());
        if (nextStatus !== ALL_STATUSES) params.set('status', nextStatus);

        const res = await fetch(
          `/api/superadmin/design-orders?${params.toString()}`
        );
        if (!res.ok) throw new Error('failed');
        const data: {
          orders: SuperadminDesignOrderRow[];
          total: number;
        } = await res.json();
        setOrders(data.orders);
        setTotal(data.total);
      } catch {
        toast.error('Impossible de charger les commandes.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  // Debounced search + status filter: reset to first page and refetch.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSkip(0);
      fetchOrders(0, search, statusFilter);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const goPrev = () => {
    const next = Math.max(0, skip - pageSize);
    setSkip(next);
    fetchOrders(next, search, statusFilter);
  };

  const goNext = () => {
    const next = skip + pageSize;
    if (next >= total) return;
    setSkip(next);
    fetchOrders(next, search, statusFilter);
  };

  const changeStatus = (
    order: SuperadminDesignOrderRow,
    status: DesignOrderStatus
  ) => {
    if (status === order.status) return;
    setUpdatingId(order.id);
    startTransition(async () => {
      const result = await superadminSetDesignOrderStatus({
        orderId: order.id,
        status
      });
      setUpdatingId(null);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.success ?? 'Statut mis à jour.');
      // Optimistically reflect the change; also refresh server data.
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status } : o))
      );
      fetchOrders(skip, search, statusFilter);
      router.refresh();
    });
  };

  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + pageSize, total);
  const busy = loading || isPending;

  return (
    <div className="space-y-4">
      {/* Search + status filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (contact, restaurant, design)…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>Tous les statuts</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Design</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Livraison</TableHead>
              <TableHead>Qté</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {busy ? 'Chargement…' : 'Aucune commande de design.'}
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {order.designName}
                      </span>
                    </div>
                    {order.notes ? (
                      <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">
                        {order.notes}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">
                      {order.restaurantName ?? '—'}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {order.ownerEmail ?? order.ownerName ?? '—'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">
                        {order.contactName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {order.contactEmail}
                      </span>
                      {order.contactPhone ? (
                        <span className="text-xs text-muted-foreground">
                          {order.contactPhone}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.deliveryMethod ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">{order.quantity}</TableCell>
                  <TableCell className="text-sm">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant(order.status)}>
                        {STATUS_LABEL[order.status]}
                      </Badge>
                      <Select
                        value={order.status}
                        onValueChange={(v) =>
                          changeStatus(order, v as DesignOrderStatus)
                        }
                        disabled={busy && updatingId === order.id}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          {updatingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ORDER.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {from}–{to} sur {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy || skip === 0}
            onClick={goPrev}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || skip + pageSize >= total}
            onClick={goNext}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
