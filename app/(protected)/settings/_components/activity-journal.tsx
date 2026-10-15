'use client';

import { History } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface ActivityEntry {
  id: string;
  actorName: string | null;
  action: string;
  summary: string;
  createdAt: string;
}

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
 * Owner-facing member activity journal (read-only). Shows what team members
 * have done on the workspace (menus, categories, dishes, …), newest first.
 */
export default function ActivityJournal({
  entries,
}: {
  entries: ActivityEntry[];
}) {
  return (
    <Card className="rounded-xl border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
            <History className="h-5 w-5" />
          </span>
          <h3 className="text-lg md:text-xl font-semibold">
            Journal d&apos;activité
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune activité de vos collaborateurs pour le moment.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
                <div className="min-w-0">
                  <p className="text-foreground">
                    <span className="font-medium">
                      {e.actorName ?? 'Un collaborateur'}
                    </span>{' '}
                    {/* The summary already reads as a sentence tail
                        ("A ajouté le plat …"). */}
                    <span className="text-muted-foreground">
                      — {e.summary}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {timeAgo(e.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
