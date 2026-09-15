'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  Eye,
  GripVertical,
  Minus,
  Plus,
  Settings
} from 'lucide-react';

import { cn } from '@/lib/utils';
import PhoneFrame from '../../(landing)/_components/ui/PhoneFrame';

type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
};

const INITIAL: Dish[] = [
  {
    id: 'd1',
    name: 'Bruschetta',
    description: 'Tomates fraîches, basilic',
    price: 7.5,
    available: true
  },
  {
    id: 'd2',
    name: 'Risotto aux cèpes',
    description: 'Parmesan, huile de truffe',
    price: 16,
    available: true
  },
  {
    id: 'd3',
    name: 'Tiramisu maison',
    description: 'Café, mascarpone, cacao',
    price: 6.5,
    available: true
  }
];

const eur = (n: number) =>
  `${Number.isInteger(n) ? n.toString() : n.toFixed(2)} €`;

/**
 * Interactive concept for the "Éditeur de la carte" section: an editor panel
 * (left) wired to a live diner-menu preview (right). Toggling "En ligne",
 * marking a dish "épuisé", or changing a price updates the customer view
 * instantly — so visitors feel how modifiable the menu is. Pure client state,
 * no backend.
 */
export default function V2LiveEditorDemo() {
  const [online, setOnline] = useState(true);
  const [dishes, setDishes] = useState<Dish[]>(INITIAL);

  const toggleDish = (id: string) =>
    setDishes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, available: !d.available } : d))
    );

  const changePrice = (id: string, delta: number) =>
    setDishes((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, price: Math.max(0, Math.round((d.price + delta) * 2) / 2) }
          : d
      )
    );

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
      {/* ---- Editor panel ---- */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronLeft className="h-4 w-4" /> Éditeur
          </span>
          <span className="text-sm font-semibold text-foreground">Menu du Midi</span>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="space-y-3 p-4">
          {/* Online toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
            <div>
              <p className="text-sm font-semibold text-foreground">En ligne</p>
              <p className="text-[11px] text-muted-foreground">
                Visible par les clients
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={online}
              onClick={() => setOnline((v) => !v)}
              className={cn(
                'flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
                online ? 'bg-yellow-400' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'h-5 w-5 rounded-full bg-white shadow transition-transform',
                  online ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <p className="px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Plats
          </p>

          {/* Dish rows */}
          {dishes.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-background p-3"
            >
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {d.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {d.description}
                </p>
              </div>

              {/* Price stepper */}
              <div className="flex items-center gap-1 rounded-lg border border-border">
                <button
                  type="button"
                  aria-label="Baisser le prix"
                  onClick={() => changePrice(d.id, -0.5)}
                  className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-14 text-center text-xs font-medium tabular-nums text-foreground">
                  {eur(d.price)}
                </span>
                <button
                  type="button"
                  aria-label="Augmenter le prix"
                  onClick={() => changePrice(d.id, 0.5)}
                  className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Availability toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={d.available}
                aria-label={`${d.name} disponible`}
                onClick={() => toggleDish(d.id)}
                className={cn(
                  'flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
                  d.available ? 'bg-yellow-400' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'h-5 w-5 rounded-full bg-white shadow transition-transform',
                    d.available ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          ))}

          <p className="px-1 pt-1 text-[11px] text-muted-foreground">
            Modifiez le prix, marquez un plat « épuisé » ou mettez la carte hors
            ligne — l&apos;aperçu se met à jour instantanément.
          </p>
        </div>
      </div>

      {/* ---- Live diner preview (inside a phone, like the live menus) ---- */}
      <div className="flex items-center justify-center">
        <PhoneFrame>
          <div className="flex h-full flex-col bg-[#faf7f2] text-left">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                <Eye className="h-3.5 w-3.5" /> Aperçu client
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  online
                    ? 'bg-green-100 text-green-700'
                    : 'bg-neutral-200 text-neutral-500'
                )}
              >
                {online ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>

            <div className="relative flex-1 overflow-hidden">
              {/* Offline overlay */}
              {!online ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#faf7f2]/90 px-6 text-center backdrop-blur-sm">
                  <p className="font-serif-display text-lg text-neutral-800">
                    Menu momentanément indisponible
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Réactivez « En ligne » pour le rendre visible.
                  </p>
                </div>
              ) : null}

              <div className="h-full overflow-y-auto px-3 pb-4 pt-2">
                <p className="font-serif-display text-center text-xl text-neutral-900">
                  Le Bistrot
                </p>
                <p className="mb-3 text-center text-[11px] uppercase tracking-widest text-yellow-600">
                  Menu du Midi
                </p>

                <div className="space-y-2.5">
                  {dishes.map((d) => (
                    <div
                      key={d.id}
                      className={cn(
                        'rounded-xl border bg-white p-3 transition-opacity',
                        d.available
                          ? 'border-[#eee6d9]'
                          : 'border-dashed border-neutral-300 opacity-60'
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-900">
                            {d.name}
                          </p>
                          {!d.available ? (
                            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-500">
                              Épuisé
                            </span>
                          ) : null}
                        </div>
                        <span
                          className={cn(
                            'font-serif-display shrink-0 text-sm tabular-nums text-neutral-900',
                            !d.available && 'line-through'
                          )}
                        >
                          {eur(d.price)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        {d.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}
