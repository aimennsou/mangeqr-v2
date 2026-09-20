'use client';

import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

import { PublicMenu, type PublicMenuProps } from '@/app/restaurant/[id]/_components/PublicMenu';
import { resolveBorneConfig, type BorneConfig } from '@/schemas';
import { Button } from '@/components/ui/button';

export interface BorneViewProps {
  menu: PublicMenuProps;
  borneConfig: BorneConfig | null;
}

/**
 * Self-order kiosk (borne de commande) view. Wraps the diner ordering UI
 * (PublicMenu, with ordering forced on) in a kiosk frame: a full-screen idle
 * welcome screen the customer touches to start, then the ordering menu. Skinned
 * by the owner's BorneConfig.
 */
export function BorneView({ menu, borneConfig }: BorneViewProps) {
  const cfg = resolveBorneConfig(borneConfig);
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <button
        type="button"
        onClick={() => setStarted(true)}
        className="flex h-screen w-screen flex-col items-center justify-center gap-8 bg-neutral-950 text-center text-neutral-50"
      >
        <span
          className="flex h-28 w-28 items-center justify-center rounded-3xl"
          style={{ backgroundColor: cfg.accent, color: '#000' }}
        >
          <UtensilsCrossed className="h-14 w-14" />
        </span>
        <div>
          <h1 className="font-serif-display text-6xl font-light tracking-tight">
            {cfg.welcomeTitle}
          </h1>
          <p className="mt-4 text-2xl text-white/60">{cfg.welcomeSubtitle}</p>
        </div>
        <span
          className="mt-6 rounded-full px-10 py-4 text-2xl font-semibold"
          style={{ backgroundColor: cfg.accent, color: '#000' }}
        >
          {menu.name}
        </span>
      </button>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-y-auto bg-background">
      {/* Ordering is forced on for the kiosk regardless of the diner toggle. */}
      <PublicMenu {...menu} orderingEnabled />

      {/* Kiosk footer: restart / cancel back to the idle screen. */}
      <div className="sticky bottom-0 z-40 flex justify-center border-t border-border bg-background/95 p-3 backdrop-blur">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setStarted(false)}
          className="text-lg"
        >
          Recommencer
        </Button>
      </div>
    </div>
  );
}
