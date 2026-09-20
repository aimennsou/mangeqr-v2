'use client';

import { useState } from 'react';
import { ExternalLink, Phone, Search } from 'lucide-react';
import type { LeadStatus } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SuperadminLeadRow, StaffOption } from '@/data/superadmin';
import { cn } from '@/lib/utils';
import { LeadCrmDialog, STATUS_LABEL } from './lead-crm-dialog';

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
    minute: '2-digit',
  });
}

export function LeadsTable({
  leads,
  staff,
}: {
  leads: SuperadminLeadRow[];
  staff: StaffOption[];
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');

  const term = query.trim().toLowerCase();
  const rows = leads.filter((l) => {
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    if (!term) return true;
    return (
      l.restaurantName.toLowerCase().includes(term) ||
      (l.contactName ?? '').toLowerCase().includes(term) ||
      (l.contactPhone ?? '').toLowerCase().includes(term) ||
      (l.contactEmail ?? '').toLowerCase().includes(term)
    );
  });

  const STATUS_TABS: (LeadStatus | 'ALL')[] = [
    'ALL',
    'NEW',
    'ORDERED',
    'CONTACTED',
    'CONVERTED',
    'CLOSED',
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (nom, téléphone, email)…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                statusFilter === s
                  ? 'border-yellow-400 bg-yellow-400/10 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {s === 'ALL' ? 'Tous' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Design</TableHead>
              <TableHead>Appels</TableHead>
              <TableHead>Assigné</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  Aucun lead.
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
                  <TableCell className="text-sm">
                    {lead.callAttempts > 0 ? (
                      <span className="font-medium">{lead.callAttempts}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {lead.assignedToName ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(lead.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-normal',
                        statusClass(lead.status)
                      )}
                    >
                      {STATUS_LABEL[lead.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <LeadCrmDialog
                        lead={lead}
                        staff={staff}
                        trigger={
                          <Button variant="outline" size="sm" className="h-8">
                            Suivi
                          </Button>
                        }
                      />
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <a
                          href={`/m/${lead.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Voir le menu"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
