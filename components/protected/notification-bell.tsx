'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, LifeBuoy, Megaphone, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/actions/notifications';

type NotificationType = 'SUPPORT_REPLY' | 'ORDER_STATUS' | 'BROADCAST';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  SUPPORT_REPLY: LifeBuoy,
  ORDER_STATUS: Package,
  BROADCAST: Megaphone,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

/**
 * Navbar notification bell (#14). Polls /api/notifications for the current
 * user's items + unread count, shows an unread badge, and lets the user open
 * each notification (marking it read) or mark all read.
 */
export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setUnread(typeof data.unread === 'number' ? data.unread : 0);
    } catch {
      // ignore transient errors
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  // Refresh when the popover opens so the list is current.
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleOpenItem = async (n: NotificationItem) => {
    if (!n.readAt) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i
        )
      );
      setUnread((u) => Math.max(0, u - 1));
      await markNotificationRead(n.id);
    }
    setOpen(false);
  };

  const handleMarkAll = async () => {
    setItems((prev) =>
      prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() }))
    );
    setUnread(0);
    await markAllNotificationsRead();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-[1.1rem] w-[1.1rem]" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold text-black">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3.5 w-3.5" /> Tout marquer comme lu
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Aucune notification.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                const unreadItem = !n.readAt;
                const content = (
                  <div
                    className={cn(
                      'flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
                      unreadItem && 'bg-yellow-400/5'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        unreadItem
                          ? 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-500'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {unreadItem && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-yellow-400" />
                    )}
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link href={n.link} onClick={() => handleOpenItem(n)}>
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenItem(n)}
                        className="w-full text-left"
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
