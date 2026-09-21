'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Phone } from 'lucide-react';
import type { DevisKind, DevisStatus } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
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
import type { SuperadminDevisRow } from '@/data/superadmin';
import { superadminSetDevisStatus } from '@/actions/superadmin';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<DevisStatus, string> = {
  NEW: 'Nouveau',
  CONTACTED: 'Contacté',
  QUOTED: 'Devis envoyé',
  WON: 'Gagné',
  CLOSED: 'Clôturé',
};

const STATUS_ORDER: DevisStatus[] = [
  'NEW',
  'CONTACTED',
  'QUOTED',
  'WON',
  'CLOSED',
];

const KIND_LABEL: Record<DevisKind, string> = {
  BORNE: 'Bornes',
  TV: 'Affichage TV',
  BOTH: 'Bornes + TV',
};

function statusClass(s: DevisStatus): string {
  switch (s) {
    case 'WON':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500';
    case 'CLOSED':
      return 'border-border text-muted-foreground';
    case 'CONTACTED':
      return 'border-blue-400/50 bg-blue-400/10 text-blue-700 dark:text-blue-400';
    case 'QUOTED':
      return 'border-purple-400/50 bg-purple-400/10 text-purple-700 dark:text-purple-400';
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

/** Compact "R:2 · B:3 · TV:1" sizing summary; omits zeros/nulls. */
function sizing(r: SuperadminDevisRow): string {
  const parts: string[] = [];
  if (r.restaurantCount) parts.push(`${r.restaurantCount} resto`);
  if (r.borneCount) parts.push(`${r.borneCount} borne(s)`);
  if (r.tvCount) parts.push(`${r.tvCount} TV`);
  return parts.length ? parts.join(' · ') : '—';
}

export function DevisTable({ requests }: { requests: SuperadminDevisRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setStatus = (id: string, status: DevisStatus) => {
    startTransition(async () => {
      const res = await superadminSetDevisStatus({ id, status });
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
            <TableHead>Contact</TableHead>
            <TableHead>Matériel</TableHead>
            <TableHead>Volumétrie</TableHead>
            <TableHead>Équipe</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                Aucune demande de devis.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {r.name}
                    </span>
                    <a
                      href={`tel:${r.phone}`}
                      className="inline-flex items-center gap-1 text-xs text-yellow-600 hover:underline dark:text-yellow-500"
                    >
                      <Phone className="h-3 w-3" /> {r.phone}
                    </a>
                    {r.email ? (
                      <span className="text-xs text-muted-foreground">
                        {r.email}
                      </span>
                    ) : null}
                    {r.restaurantName ? (
                      <span className="text-xs text-muted-foreground">
                        {r.restaurantName}
                      </span>
                    ) : null}
                    {r.userEmail ? (
                      <Badge
                        variant="outline"
                        className="mt-1 w-fit border-blue-400/50 bg-blue-400/10 text-[10px] font-normal text-blue-700 dark:text-blue-400"
                      >
                        Compte : {r.userEmail}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{KIND_LABEL[r.kind]}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {sizing(r)}
                </TableCell>
                <TableCell className="max-w-[180px] text-sm text-muted-foreground">
                  <div className="truncate" title={r.teamType ?? undefined}>
                    {r.teamType ?? '—'}
                  </div>
                  {r.message ? (
                    <div
                      className="truncate text-xs italic"
                      title={r.message}
                    >
                      “{r.message}”
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(r.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-normal',
                        statusClass(r.status),
                      )}
                    >
                      {STATUS_LABEL[r.status]}
                    </Badge>
                    <Select
                      value={r.status}
                      onValueChange={(v) => setStatus(r.id, v as DevisStatus)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
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
