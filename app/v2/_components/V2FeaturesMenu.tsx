'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Star,
  ChefHat,
  Truck,
  MonitorSmartphone,
  Tv,
  QrCode,
  FileText,
  Building2,
  Users,
  UtensilsCrossed,
  Sparkles,
  Coffee,
  Croissant,
  Car,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

interface MenuEntry {
  icon: LucideIcon;
  /** Dictionary namespace under `landing.menu.*`; `.title` / `.desc` are derived. */
  key: string;
  href: string;
}

// Main product features (mirrors what the landing page showcases).
const FEATURES: MenuEntry[] = [
  { icon: QrCode, key: 'qr', href: '/#tarifs' },
  { icon: Star, key: 'reputation', href: '/#tarifs' },
  { icon: ChefHat, key: 'kitchen', href: '/#tarifs' },
  { icon: Truck, key: 'delivery', href: '/#tarifs' },
  { icon: MonitorSmartphone, key: 'kiosk', href: '/#kit-restaurateur' },
  { icon: Tv, key: 'tv', href: '/#kit-restaurateur' },
  { icon: FileText, key: 'printed', href: '/#tarifs' },
  { icon: Building2, key: 'multi', href: '/#tarifs' },
  { icon: Users, key: 'team', href: '/#tarifs' },
];

// Use cases by establishment type.
const USE_CASES: MenuEntry[] = [
  { icon: Sparkles, key: 'upscale', href: '/go/fr' },
  { icon: UtensilsCrossed, key: 'fastfood', href: '/go/fr' },
  { icon: Coffee, key: 'cafeteria', href: '/go/fr' },
  { icon: Croissant, key: 'bakery', href: '/go/fr' },
  { icon: Car, key: 'foodtruck', href: '/go/fr' },
];

/**
 * Landing navbar dropdown. Two variants:
 *  - 'features'  → the wide product-features mega-menu ("Fonctionnalités")
 *  - 'usecases'  → the establishment-type dropdown ("Cas d'usage")
 * Opens on hover (desktop) or click; each item links to the relevant section
 * or the funnel.
 */
export default function V2FeaturesMenu({
  variant = 'features',
}: {
  variant?: 'features' | 'usecases';
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isFeatures = variant === 'features';
  const label = t(
    isFeatures ? 'landing.nav.features' : 'landing.nav.useCases'
  );

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  // Close on outside click / Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative hidden sm:block"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          open
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {label}
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div
          className={cn(
            'absolute top-full z-50 mt-2 px-2',
            isFeatures
              ? 'left-0 w-[min(92vw,640px)]'
              : 'left-0 w-[min(92vw,320px)]'
          )}
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-xl">
            <p className="mb-3 px-2 text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              {label}
            </p>
            <div
              className={cn(
                'grid grid-cols-1 gap-1',
                isFeatures && 'sm:grid-cols-2'
              )}
            >
              {(isFeatures ? FEATURES : USE_CASES).map((entry) => (
                <MenuItem
                  key={entry.key}
                  entry={entry}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  entry,
  onNavigate,
}: {
  entry: MenuEntry;
  onNavigate: () => void;
}) {
  const { t } = useI18n();
  const Icon = entry.icon;
  return (
    <Link
      href={entry.href}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 transition-colors group-hover:bg-yellow-400 group-hover:text-black dark:text-yellow-500">
        <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">
          {t(`landing.menu.${entry.key}.title` as TranslationKey)}
        </span>
        <span className="block text-xs leading-snug text-muted-foreground">
          {t(`landing.menu.${entry.key}.desc` as TranslationKey)}
        </span>
      </span>
    </Link>
  );
}
