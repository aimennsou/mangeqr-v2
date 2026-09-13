'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import type { MenuAppearance } from '@/schemas';
import { I18nProvider } from '@/lib/i18n';
import { PublicMenu, type PublicMenuProps } from '@/app/restaurant/[id]/_components/PublicMenu';

interface MenuAppearancePreviewProps {
  /** The selected restaurant whose REAL diner menu is previewed. */
  restaurantId: string;
  /**
   * The current (unsaved) appearance draft coming from the editor. Purely
   * visual: this component never persists anything — it only overrides the
   * saved appearance so the owner sees the effect of their edits live (D.4).
   */
  appearance: Required<MenuAppearance> | null | undefined;
  className?: string;
}

/** Data returned by `GET /api/magasin/menu-preview` — the PublicMenu props
 *  minus the appearance override (which the preview supplies from the draft). */
type PreviewMenuData = Omit<PublicMenuProps, 'menuAppearance' | 'previewMode'> & {
  menuAppearance: MenuAppearance | null;
};

/**
 * Phone-style live preview of the REAL diner menu (D.4/D.5).
 *
 * It fetches the actual restaurant menu (real categories/dishes/info) from the
 * owner-scoped preview endpoint and renders the SAME `PublicMenu` component the
 * diners see, re-skinned by the unsaved `appearance` draft. Nothing is
 * persisted here — the draft only overrides the saved look in this view.
 */
export default function MenuAppearancePreview({
  restaurantId,
  appearance,
  className,
}: MenuAppearancePreviewProps) {
  const [menuData, setMenuData] = useState<PreviewMenuData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  // The fixed-size phone SCREEN element; the dish dialog portals here so it is
  // contained to the visible phone viewport (see PublicMenu previewContainer).
  const [screenEl, setScreenEl] = useState<HTMLDivElement | null>(null);

  // Fetch the real menu data whenever the selected restaurant changes.
  useEffect(() => {
    if (!restaurantId) return;

    let cancelled = false;
    setStatus('loading');
    setMenuData(null);

    fetch(`/api/magasin/menu-preview?restaurantId=${encodeURIComponent(restaurantId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('preview fetch failed');
        return (await res.json()) as PreviewMenuData;
      })
      .then((data) => {
        if (cancelled) return;
        setMenuData(data);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <p className="text-sm font-medium text-muted-foreground">Aperçu en direct</p>

      {/* Device frame */}
      <div className="w-[300px] rounded-[2.5rem] border-[10px] border-gray-900 bg-gray-900 shadow-xl">
        {/* Screen (portal target for the contained dish dialog) */}
        <div
          ref={setScreenEl}
          className="relative h-[560px] overflow-hidden rounded-[1.8rem] bg-white"
        >
          {/* Notch / status bar */}
          <div className="relative z-10 flex h-6 items-center justify-center bg-black/5">
            <div className="absolute left-1/2 top-1 h-4 w-20 -translate-x-1/2 rounded-full bg-gray-900" />
          </div>

          {/* Scrollable menu content */}
          <div className="h-[calc(560px-1.5rem)] overflow-y-auto">
            {status === 'loading' ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                Chargement de l&apos;aperçu...
              </div>
            ) : status === 'error' || !menuData ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                Aperçu indisponible.
              </div>
            ) : (
              // The real diner menu, re-skinned by the unsaved draft. `PublicMenu`
              // is responsive (max-w-lg) so it shrinks to the phone screen width.
              <I18nProvider isolated>
                <PublicMenu
                  {...menuData}
                  menuAppearance={appearance ?? menuData.menuAppearance}
                  previewMode
                  previewContainer={screenEl}
                />
              </I18nProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
