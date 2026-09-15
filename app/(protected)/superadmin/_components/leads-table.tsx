'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ExternalLink, Phone } from 'lucide-react';
import type { LeadStatus } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { SuperadminLeadRow } from '@/data/superadmin';
import { superadminSetLeadStatus } from '@/actions/superadmin';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: 'Nouveau',
  ORDERED: 'A commandé',
  CONTACTED: 'Contacté',
  CONVERTED: 'Converti',
  CLOSED: 'Fermé'
};

const STATUS_ORDER: LeadStatus[] = [
  'NEW',
  'ORDERED',
  'CONTACTED',
  'CONVERTED',
  'CLOSED'
];

function statusClass(s: LeadStatus): string {
  switch (s) {
    case 'ORDERED':
      return 'border-yellow-400/60 bg-yellow-400/10 text-yellow-700 dark:text-yellow-500';
    case 'CONVERTED':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500';
    case 'CLOSED':
      return 'border-border text-muted-foreground';
    case 'CONTACTED':
      return 'border-blue-400/50 bg-blue-400/10 text-blue-700 dark:text-blue-400';
    default:
      return 'border-border text-foreground';
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
    minute: '2-digit'
  });
}

export function LeadsTable({ leads }: { leads: SuperadminLeadRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState(leads);

  const setStatus = (id: string, status: LeadStatus) => {
    setRows((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    startTransition(async () => {
      const res = await superadminSetLeadStatus({ id, status });
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
            <TableHead>Restaurant</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Design</TableHead>
            <TableHead>Langue</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Menu</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Aucun lead pour le moment.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {lead.restaurantName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {lead.categoryCount} catégorie
                      {lead.categoryCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {lead.contactName || lead.contactPhone ? (
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">
                        {lead.contactName ?? '—'}
                      </span>
                      {lead.contactPhone ? (
                        <a
                          href={`tel:${lead.contactPhone}`}
                          className="flex items-center gap-1 text-xs text-yellow-600 hover:underline dark:text-yellow-500"
                        >
                          <Phone className="h-3 w-3" /> {lead.contactPhone}
                        </a>
                      ) : null}
                      {lead.contactEmail ? (
                        <span className="text-xs text-muted-foreground">
                          {lead.contactEmail}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Menu seul
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {lead.designName ? (
                    <span>
                      {lead.designName}
                      {lead.quantity ? ` ×${lead.quantity}` : ''}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs uppercase text-muted-foreground">
                  {lead.locale}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(lead.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-normal', statusClass(lead.status))}
                    >
                      {STATUS_LABEL[lead.status]}
                    </Badge>
                    <Select
                      value={lead.status}
                      onValueChange={(v) => setStatus(lead.id, v as LeadStatus)}
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
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <a
                      href={`/m/${lead.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Voir le menu"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
