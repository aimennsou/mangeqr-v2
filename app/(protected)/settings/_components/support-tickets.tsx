'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { SupportMessageStatus } from '@prisma/client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import SupportThread, {
  type ThreadReply
} from '@/components/support/support-thread';
import { userReplyToTicket } from '@/actions/support';
import { cn } from '@/lib/utils';

export interface SupportTicketView {
  id: string;
  name: string;
  email: string;
  message: string;
  status: SupportMessageStatus;
  createdAt: string;
  updatedAt: string;
  replies: ThreadReply[];
}

interface SupportTicketsProps {
  tickets: SupportTicketView[];
  labels: {
    title: string;
    description: string;
    empty: string;
    replyPlaceholder: string;
    reply: string;
    closed: string;
    statusNew: string;
    statusRead: string;
    statusResolved: string;
  };
}

function fmtDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * User-facing support history. Lists the signed-in user's own tickets with
 * their state, and opens a conversation thread where they can read staff
 * replies and post their own (which reopens the ticket).
 */
export default function SupportTickets({
  tickets,
  labels
}: SupportTicketsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState<SupportTicketView | null>(null);
  const [reply, setReply] = useState('');

  const statusMeta = (status: SupportMessageStatus) => {
    switch (status) {
      case 'NEW':
        return {
          label: labels.statusNew,
          className:
            'border-yellow-400/60 bg-yellow-400/10 text-yellow-700 dark:text-yellow-500'
        };
      case 'READ':
        return {
          label: labels.statusRead,
          className: 'border-border text-muted-foreground'
        };
      case 'RESOLVED':
        return {
          label: labels.statusResolved,
          className:
            'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500'
        };
    }
  };

  const open = (t: SupportTicketView) => {
    setActive(t);
    setReply('');
  };

  const sendReply = () => {
    if (!active || reply.trim().length === 0) return;
    const ticketId = active.id;
    const body = reply.trim();
    startTransition(async () => {
      const res = await userReplyToTicket({ ticketId, body });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Réponse envoyée.');
      setReply('');
      router.refresh();
      setActive((prev) =>
        prev && prev.id === ticketId
          ? {
              ...prev,
              status: 'NEW',
              replies: [
                ...prev.replies,
                {
                  id: `tmp-${Date.now()}`,
                  authorRole: 'USER',
                  authorName: prev.name,
                  body,
                  createdAt: new Date()
                }
              ]
            }
          : prev
      );
    });
  };

  return (
    <Card className="rounded-xl border-border shadow-none md:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold md:text-xl">{labels.title}</h3>
            <p className="text-sm text-muted-foreground">{labels.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            {labels.empty}
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {tickets.map((t) => {
              const meta = statusMeta(t.status);
              const lastReply = t.replies[t.replies.length - 1];
              const preview = lastReply?.body ?? t.message;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => open(t)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-normal', meta.className)}
                        >
                          {meta.label}
                        </Badge>
                        {t.replies.length > 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {t.replies.length} réponse
                            {t.replies.length > 1 ? 's' : ''}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-foreground">
                        {preview}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {fmtDate(t.createdAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {/* Conversation sheet */}
      <Sheet open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {active ? (
            <>
              <SheetHeader className="space-y-1 border-b border-border px-6 py-5 text-left">
                <div className="flex items-center gap-2">
                  <SheetTitle className="font-serif-display text-xl font-medium tracking-tight">
                    {labels.title}
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
                <SheetDescription>{fmtDate(active.createdAt)}</SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <SupportThread
                  viewer="user"
                  opening={{
                    name: active.name,
                    body: active.message,
                    createdAt: active.createdAt
                  }}
                  replies={active.replies}
                />
              </div>

              <div className="border-t border-border px-6 py-4">
                {active.status === 'RESOLVED' ? (
                  <p className="text-center text-sm text-muted-foreground">
                    {labels.closed}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      rows={3}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder={labels.replyPlaceholder}
                      className="resize-none"
                      disabled={isPending}
                    />
                    <Button
                      className="self-end bg-yellow-400 text-black hover:bg-yellow-400/90"
                      disabled={isPending || reply.trim().length === 0}
                      onClick={sendReply}
                    >
                      <Send className="mr-2 h-4 w-4" /> {labels.reply}
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
