'use client';

import type { SupportAuthorRole } from '@prisma/client';

import { cn } from '@/lib/utils';

export interface ThreadReply {
  id: string;
  authorRole: SupportAuthorRole;
  authorName: string | null;
  body: string;
  createdAt: Date | string;
}

interface SupportThreadProps {
  /** The opening message (the original ticket body). */
  opening: { name: string; body: string; createdAt: Date | string };
  replies: ThreadReply[];
  /** Whose perspective is viewing — controls bubble alignment/labels. */
  viewer: 'user' | 'staff';
}

function fmt(value: Date | string): string {
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

function Bubble({
  side,
  label,
  time,
  body,
  tone
}: {
  side: 'left' | 'right';
  label: string;
  time: string;
  body: string;
  tone: 'user' | 'staff';
}) {
  return (
    <div className={cn('flex', side === 'right' ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[85%]">
        <div
          className={cn(
            'mb-1 flex items-center gap-2 text-[11px] text-muted-foreground',
            side === 'right' && 'justify-end'
          )}
        >
          <span className="font-medium text-foreground">{label}</span>
          <span>{time}</span>
        </div>
        <div
          className={cn(
            'whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            tone === 'staff'
              ? 'bg-yellow-400/15 text-foreground'
              : 'border border-border bg-muted/50 text-foreground'
          )}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

/**
 * Renders a support conversation: the opening message followed by replies as
 * chat bubbles. STAFF messages sit on one side and USER messages on the other,
 * flipped depending on who is viewing so "my" messages are always on the right.
 */
export default function SupportThread({
  opening,
  replies,
  viewer
}: SupportThreadProps) {
  // The opening message is always authored by the USER.
  const openingSide = viewer === 'user' ? 'right' : 'left';

  return (
    <div className="space-y-4">
      <Bubble
        side={openingSide}
        label={opening.name}
        time={fmt(opening.createdAt)}
        body={opening.body}
        tone="user"
      />
      {replies.map((r) => {
        const isStaff = r.authorRole === 'STAFF';
        const mine =
          (viewer === 'staff' && isStaff) || (viewer === 'user' && !isStaff);
        return (
          <Bubble
            key={r.id}
            side={mine ? 'right' : 'left'}
            label={
              isStaff ? r.authorName ?? 'Support MangeQR' : r.authorName ?? 'Client'
            }
            time={fmt(r.createdAt)}
            body={r.body}
            tone={isStaff ? 'staff' : 'user'}
          />
        );
      })}
    </div>
  );
}
