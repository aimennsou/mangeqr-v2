'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Restaurant } from '@/types';
import type { MenuAppearance } from '@/schemas';

import MenuAppearanceForm from './MenuAppearanceForm';
import MenuAppearancePreview from './MenuAppearancePreview';
import { withAppearanceDefaults } from './appearance-defaults';

/**
 * Owner-facing "Apparence" section of the Menu numérique page (D.3).
 *
 * Resolves the active restaurant the same way the sibling QR section does —
 * via the owner-scoped `GET /api/magasin` — then renders the appearance editor
 * pre-filled with that restaurant's current `menuAppearance` (falling back to
 * the default look when it is unset).
 *
 * A phone-style preview (D.4) sits beside the editor: the form pushes every
 * unsaved edit through the `onAppearanceChange` seam, this section holds that
 * draft in state, and the preview re-skins a sample menu from it live. The
 * draft is visual only — persistence still happens exclusively on Save via the
 * form's `updateMenuAppearance` call.
 */
export default function AppearanceSection() {
  const { theme } = useTheme();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');

  // D.4: the latest (unsaved) appearance for the selected restaurant. Fed to
  // the preview so it reflects live edits; never persisted here.
  const [draftAppearance, setDraftAppearance] =
    useState<Required<MenuAppearance> | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch('/api/magasin');
        const data = res.ok ? await res.json() : [];
        const list = Array.isArray(data) ? data : [];
        setRestaurants(list);
        if (list.length > 0) setSelectedId(list[0].id);
      } catch {
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const selected = restaurants.find((r) => r.id === selectedId);
  const initialAppearance: MenuAppearance | null =
    selected?.menuAppearance ?? null;

  // Refresh the preview to the newly selected restaurant's saved look before
  // any edit. The form also re-emits via `onAppearanceChange` on mount (it is
  // remounted through `key`), but seeding here avoids a flash of stale draft.
  useEffect(() => {
    setDraftAppearance(
      selected ? withAppearanceDefaults(selected.menuAppearance) : null
    );
  }, [selected]);

  // Stable identity for the D.4 seam so the form's emit effect does not re-run
  // on every parent render (which would loop with `setDraftAppearance`).
  // `setDraftAppearance` from `useState` is stable, so `[]` deps are correct.
  const handleAppearanceChange = useCallback(
    (values: MenuAppearance) => setDraftAppearance(withAppearanceDefaults(values)),
    []
  );

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-16">Chargement...</div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        <div className="flex justify-center">
          <Image
            className={`${theme === 'dark' ? 'dark:invert' : ''}`}
            src="/images/empty-numerique.png"
            alt="Aucun restaurant"
            width={400}
            height={400}
            priority
          />
        </div>
        <p className="text-lg font-semibold mt-4">Aucun menu disponible.</p>
        <p className="mt-2">
          Créez votre premier restaurant pour personnaliser son apparence.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="max-w-2xl space-y-2">
        <Label>Restaurant</Label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger>
            <SelectValue placeholder="Choisissez un restaurant" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {restaurants.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <MenuAppearanceForm
            // `key` forces a fresh form when the restaurant changes so the new
            // restaurant's saved values become the form's clean baseline.
            key={selected.id}
            restaurantId={selected.id}
            initialAppearance={initialAppearance}
            onAppearanceChange={handleAppearanceChange}
          />

          <div className="lg:sticky lg:top-6">
            <MenuAppearancePreview
              restaurantId={selected.id}
              appearance={draftAppearance}
            />
          </div>
        </div>
      )}
    </div>
  );
}
