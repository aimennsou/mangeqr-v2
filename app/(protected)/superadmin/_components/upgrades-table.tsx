'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Phone, Check } from 'lucide-react';
import type { PlanUpgradeStatus } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SuperadminUpgradeRequestRow } from '@/data/superadmin';
import { superadminSetUpgradeStatus } from '@/actions/superadmin';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<PlanUpgradeStatus, string> = {
  PENDING: 'En attente',
  CONTACTED: 'Contacté',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
};

const STATUS_ORDER: PlanUpgradeStatus[] = [
  'PENDING',
  'CONTACTED',
  'APPROVED',
  'REJECTED',
];

function statusClass(s: PlanUpgradeStatus): string {
  switch (s) {
    case 'APPROVED':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500';
    case 'REJECTED':
      return 'border-border text-muted-foreground';
    case 'CONTACTED':
      return 'border-blue-400/50 bg-blue-400/10 text-blue-700 dark:text-blue-400';
    default:
      return 'border-yellow-400/60 bg-yellow-400/10 text-yellow-700 dark:text-yellow-500';
  }
}

function formatDate(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function UpgradesTable({
  requests,
}: {
  requests: SuperadminUpgradeRequestRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setStatus = (id: string, status: PlanUpgradeStatus) => {
    startTransition(async () => {
      const res = await superadminSetUpgradeStatus({ id, status });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Mis à jour.');
      router.refresh();
    });
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Compte</TableHead>
            <TableHead>Forfait</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                Aucune demande de mise à niveau.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {r.userName ?? '—'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.userEmail ?? '—'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <span className="text-muted-foreground">{r.currentPlan}</span>
                  {' → '}
                  <span className="font-medium">{r.targetPlan}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({r.frequency})
                  </span>
                </TableCell>
                <TableCell className="text-sm">{r.priceLabel ?? '—'}</TableCell>
                <TableCell>
                  {r.contactPhone ? (
                    <a
                      href={`tel:${r.contactPhone}`}
                      className="inline-flex items-center gap-1 text-xs text-yellow-600 hover:underline dark:text-yellow-500"
                    >
                      <Phone className="h-3 w-3" /> {r.contactPhone}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(r.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] font-normal', statusClass(r.status))}
                  >
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {r.status !== 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setStatus(r.id, 'APPROVED')}
                        className="h-8 border-emerald-500/40 text-emerald-700 dark:text-emerald-500"
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Approuver
                      </Button>
                    )}
                    <Select
                      value={r.status}
                      onValueChange={(v) =>
                        setStatus(r.id, v as PlanUpgradeStatus)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue />
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
  );
}
