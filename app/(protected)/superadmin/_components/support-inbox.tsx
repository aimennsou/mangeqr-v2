'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Mail, MailOpen, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { SupportMessageStatus } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import type { SuperadminSupportMessageRow } from '@/data/superadmin';
import {
  superadminSetSupportStatus,
  superadminReplyToTicket
} from '@/actions/superadmin';
import SupportThread from '@/components/support/support-thread';
import { cn } from '@/lib/utils';

type Status = SupportMessageStatus;

function formatDate(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function statusMeta(status: Status): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'NEW':
      return {
        label: 'Nouveau',
        className:
          'border-yellow-400/60 bg-yellow-400/10 text-yellow-700 dark:text-yellow-500'
      };
    case 'READ':
      return { label: 'Lu', className: 'border-border text-muted-foreground' };
    case 'RESOLVED':
      return {
        label: 'Traité',
        className:
          'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500'
      };
  }
}

const FILTERS: { value: Status | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'NEW', label: 'Nouveaux' },
  { value: 'READ', label: 'Lus' },
  { value: 'RESOLVED', label: 'Traités' }
];

export function SupportInbox({
  messages
}: {
  messages: SuperadminSupportMessageRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Status | 'ALL'>('ALL');
  const [active, setActive] = useState<SuperadminSupportMessageRow | null>(
    null
  );
  const [reply, setReply] = useState('');

  const visible =
    filter === 'ALL' ? messages : messages.filter((m) => m.status === filter);

  const setStatus = (id: string, status: Status) => {
    startTransition(async () => {
      const res = await superadminSetSupportStatus({ id, status });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Message mis à jour.');
      setActive((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      router.refresh();
    });
  };

  const openMessage = (m: SuperadminSupportMessageRow) => {
    setActive(m);
    setReply('');
    // Auto-mark NEW → READ on open.
    if (m.status === 'NEW') setStatus(m.id, 'READ');
  };

  const sendReply = () => {
    if (!active || reply.trim().length === 0) return;
    startTransition(async () => {
      const res = await superadminReplyToTicket({
        ticketId: active.id,
        body: reply.trim()
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Réponse envoyée.');
      setReply('');
      router.refresh();
      // Optimistically reflect the reply + READ status in the open sheet.
      setActive((prev) =>
        prev && prev.id === active.id
          ? {
              ...prev,
              status: 'READ',
              replies: [
                ...prev.replies,
                {
                  id: `tmp-${Date.now()}`,
                  authorRole: 'STAFF',
                  authorName: 'Support MangeQR',
                  body: reply.trim(),
                  createdAt: new Date()
                }
              ]
            }
          : prev
      );
    });
  };

  return (
    <div className="space-y-5">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              filter === f.value
                ? 'border-yellow-400 bg-yellow-400/15 text-yellow-700 dark:text-yellow-500'
                : 'border-border text-muted-foreground hover:bg-muted'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Aucun message.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {visible.map((m) => {
            const meta = statusMeta(m.status);
            const unread = m.status === 'NEW';
            return (
              <li key={m.id}>
                <button
                  onClick={() => openMessage(m)}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      unread
                        ? 'bg-yellow-400/15 text-yellow-600 dark:text-yellow-500'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {unread ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      <MailOpen className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'truncate text-sm',
                          unread
                            ? 'font-semibold text-foreground'
                            : 'font-medium text-foreground'
                        )}
                      >
                        {m.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-normal', meta.className)}
                      >
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.email}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {m.message}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(m.createdAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Message detail sheet */}
      <Sheet
        open={active !== null}
        onOpenChange={(o) => !o && setActive(null)}
      >
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {active ? (
            <>
              <SheetHeader className="space-y-1 border-b border-border px-6 py-5 text-left">
                <div className="flex items-center gap-2">
                  <SheetTitle className="font-serif-display text-2xl font-medium tracking-tight">
                    {active.name}
                  </SheetTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-normal',
                      statusMeta(active.status).className
                    )}
                  >
                    {statusMeta(active.status).label}
                  </Badge>
                </div>
                <SheetDescription>
                  <a
                    href={`mailto:${active.email}`}
                    className="text-yellow-600 hover:underline dark:text-yellow-500"
                  >
                    {active.email}
                  </a>
                  <span className="mx-1.5 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {formatDate(active.createdAt)}
                  </span>
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <SupportThread
                  viewer="staff"
                  opening={{
                    name: active.name,
                    body: active.message,
                    createdAt: active.createdAt
                  }}
                  replies={active.replies}
                />
              </div>

              <div className="space-y-3 border-t border-border px-6 py-4">
                {/* Reply box */}
                <div className="flex flex-col gap-2">
                  <Textarea
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Répondre au client…"
                    className="resize-none"
                    disabled={isPending}
                  />
                  <Button
                    className="self-end bg-yellow-400 text-black hover:bg-yellow-400/90"
                    disabled={isPending || reply.trim().length === 0}
                    onClick={sendReply}
                  >
                    <Send className="mr-2 h-4 w-4" /> Répondre
                  </Button>
                </div>
                {/* Status controls */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={isPending || active.status === 'READ'}
                    onClick={() => setStatus(active.id, 'READ')}
                  >
                    <MailOpen className="mr-2 h-4 w-4" />
                    Marquer lu
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 text-white hover:bg-emerald-600/90"
                    disabled={isPending || active.status === 'RESOLVED'}
                    onClick={() => setStatus(active.id, 'RESOLVED')}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marquer traité
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
