'use client';

import { useState } from 'react';
import { Heart, Instagram, Facebook, Youtube } from 'lucide-react';
import { FaTiktok, FaXTwitter } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

// -----------------------------------------------------------------------------
// A self-contained, explorable digital menu rendered directly inside the phone
// frame (no iframe). Diners can switch tabs and "like" items — a live preview
// of the real MangeQR diner experience.
// -----------------------------------------------------------------------------

type Item = {
  name: string;
  description: string;
  price: string;
  emoji: string;
  tint: string; // tailwind bg for the image tile
  tags: { label: string; tone: 'green' | 'orange' | 'blue' }[];
  contains?: string;
  likes: number;
};

type Category = { title: string; items: Item[] };

const TABS = ['Menu', 'Boissons', 'Menu de la semaine'] as const;
type Tab = (typeof TABS)[number];

const MENU: Record<Tab, Category[]> = {
  Menu: [
    {
      title: 'Entrées',
      items: [
        {
          name: 'Bruschetta',
          description: 'Pain grillé, tomates fraîches et basilic',
          price: '9,50 CHF',
          emoji: '🍅',
          tint: 'bg-rose-100',
          tags: [
            { label: 'Végétarien', tone: 'green' },
            { label: 'Maison', tone: 'orange' },
          ],
          contains: 'Gluten · Sulfites',
          likes: 53,
        },
        {
          name: 'Soupe du jour',
          description: 'Soupe fraîche préparée chaque jour',
          price: '6 CHF',
          emoji: '🥣',
          tint: 'bg-amber-100',
          tags: [
            { label: 'De saison', tone: 'orange' },
            { label: 'Maison', tone: 'orange' },
          ],
          contains: 'Céleri · Lait',
          likes: 12,
        },
        {
          name: 'Salade mixte',
          description: 'Légumes de saison frais',
          price: '6 CHF',
          emoji: '🥗',
          tint: 'bg-emerald-100',
          tags: [
            { label: 'Vegan', tone: 'green' },
            { label: 'Léger', tone: 'blue' },
          ],
          contains: 'Moutarde · Sulfites',
          likes: 8,
        },
      ],
    },
    {
      title: 'Plats',
      items: [
        {
          name: 'Risotto aux champignons',
          description: 'Risotto crémeux, cèpes et parmesan',
          price: '15 CHF',
          emoji: '🍚',
          tint: 'bg-yellow-100',
          tags: [{ label: 'Végétarien', tone: 'green' }],
          contains: 'Lait',
          likes: 27,
        },
        {
          name: 'Steak frites',
          description: 'Entrecôte grillée, frites maison',
          price: '18,50 CHF',
          emoji: '🥩',
          tint: 'bg-orange-100',
          tags: [{ label: 'Populaire', tone: 'orange' }],
          likes: 41,
        },
      ],
    },
  ],
  Boissons: [
    {
      title: 'Boissons',
      items: [
        {
          name: 'Limonade maison',
          description: 'Citrons pressés, menthe fraîche',
          price: '5 CHF',
          emoji: '🍋',
          tint: 'bg-lime-100',
          tags: [{ label: 'Maison', tone: 'orange' }],
          likes: 19,
        },
        {
          name: 'Café espresso',
          description: 'Torréfaction artisanale',
          price: '3,50 CHF',
          emoji: '☕',
          tint: 'bg-amber-100',
          tags: [{ label: 'Bio', tone: 'green' }],
          likes: 33,
        },
      ],
    },
  ],
  'Menu de la semaine': [
    {
      title: 'Formule midi',
      items: [
        {
          name: 'Entrée + Plat + Dessert',
          description: 'Formule complète du lundi au vendredi',
          price: '24 CHF',
          emoji: '🍽️',
          tint: 'bg-yellow-100',
          tags: [{ label: 'Best-seller', tone: 'orange' }],
          likes: 64,
        },
      ],
    },
  ],
};

function Tag({ label, tone }: { label: string; tone: 'green' | 'orange' | 'blue' }) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-orange-50 text-orange-700',
    blue: 'bg-sky-50 text-sky-700',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
        tones[tone]
      )}
    >
      {label}
    </span>
  );
}

function ItemCard({ item }: { item: Item }) {
  // Local like state so each card is individually interactive.
  const [liked, setLiked] = useState(false);
  const likeCount = item.likes + (liked ? 1 : 0);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm">
      <div className="flex gap-3">
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl',
            item.tint
          )}
        >
          {item.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-gray-900">
              {item.name}
            </p>
            <p className="shrink-0 text-sm font-semibold text-gray-900">
              {item.price}
            </p>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-500">
            {item.description}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <Tag key={t.label} label={t.label} tone={t.tone} />
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            {item.contains ? (
              <p className="truncate text-[10px] text-gray-400">
                Contient · {item.contains}
              </p>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              aria-pressed={liked}
              aria-label={liked ? 'Retirer le like' : 'Aimer ce plat'}
              className="flex shrink-0 items-center gap-1 text-gray-400 transition-colors hover:text-rose-500"
            >
              <Heart
                className={cn(
                  'h-3.5 w-3.5 transition-colors',
                  liked && 'fill-rose-500 text-rose-500'
                )}
              />
              <span className="text-[10px] tabular-nums">{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveMenu() {
  const [tab, setTab] = useState<Tab>('Menu');
  const categories = MENU[tab];

  return (
    <div className="flex h-full flex-col bg-[#faf7f2] text-left">
      {/* Status bar spacer + header */}
      <div className="px-4 pb-2 pt-3">
        <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-gray-500">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span>●●●</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-lg">
            🍽️
          </div>
          <div>
            <p className="text-sm font-bold leading-none text-gray-900">
              Le Petit Gourmet
            </p>
            <p className="mt-0.5 text-[10px] text-gray-500">Menu numérique</p>
          </div>
        </div>
      </div>

      {/* Social row: Instagram · Facebook · TikTok · X · YouTube */}
      <div className="flex items-center gap-3 border-y border-gray-100 bg-white/60 px-4 py-1.5 text-gray-400">
        <span className="text-[10px] font-medium">Suivez-nous</span>
        <Instagram className="h-3.5 w-3.5" />
        <Facebook className="h-3.5 w-3.5" />
        <FaTiktok className="h-3 w-3" />
        <FaXTwitter className="h-3 w-3" />
        <Youtube className="h-3.5 w-3.5" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
              tab === t
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Scrollable menu body */}
      <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-4">
        {categories.map((cat) => (
          <div key={cat.title} className="space-y-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {cat.title}
            </p>
            {cat.items.map((item) => (
              <ItemCard key={item.name} item={item} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
