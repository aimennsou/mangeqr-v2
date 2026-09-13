'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Instagram, Facebook, Youtube, MapPin } from 'lucide-react';
import { FaTiktok, FaXTwitter } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

// -----------------------------------------------------------------------------
// A self-contained, explorable digital menu rendered directly inside the phone
// frame (no iframe). This is the LANDING-PAGE mockup and mirrors the real diner
// menu UI (app/restaurant/[id]/_components/PublicMenu): logo top bar + centered
// title, pill menu tabs, a cover image with the name overlaid, a "Suivez-nous"
// bar, and dish cards with diet-tag badges + a "Contient :" allergen row +
// heart count. Diners can switch tabs and "like" items.
// -----------------------------------------------------------------------------

type Tag = { label: string; tone: 'green' | 'orange' | 'red' | 'yellow' };

type Item = {
  name: string;
  description: string;
  price: string;
  photo: string;
  tags: Tag[];
  contains?: string[];
  likes: number;
};

type Category = { title: string; items: Item[] };

const TABS = ['Plats', 'Boissons', 'Carte de la Semaine'] as const;
type Tab = (typeof TABS)[number];

const MENU: Record<Tab, Category[]> = {
  Plats: [
    {
      title: 'Entrées',
      items: [
        {
          name: 'Bruschetta',
          description: 'Pain grillé aux tomates fraîches et basilic',
          price: '7,50 €',
          photo: '/images/seed/bruschetta.jpg',
          tags: [
            { label: 'Végétarien', tone: 'green' },
            { label: 'Fait maison', tone: 'orange' },
          ],
          contains: ['Gluten', 'Sulfites'],
          likes: 53,
        },
        {
          name: 'Soupe du Jour',
          description: 'Soupe du jour fraîchement préparée',
          price: '4,50 €',
          photo: '/images/seed/soup.jpg',
          tags: [
            { label: 'De saison', tone: 'yellow' },
            { label: 'Fait maison', tone: 'orange' },
          ],
          contains: ['Céleri', 'Lait'],
          likes: 42,
        },
        {
          name: 'Salade Composée',
          description: 'Légumes frais de saison',
          price: '4,50 €',
          photo: '/images/seed/salad.jpg',
          tags: [
            { label: 'Végétarien', tone: 'green' },
            { label: 'De saison', tone: 'yellow' },
          ],
          contains: ['Moutarde'],
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
          price: '15,00 €',
          photo: '/images/seed/risotto.jpg',
          tags: [{ label: 'Végétarien', tone: 'green' }],
          contains: ['Lait'],
          likes: 27,
        },
        {
          name: 'Steak frites',
          description: 'Entrecôte grillée, frites maison',
          price: '18,50 €',
          photo: '/images/seed/steak.jpg',
          tags: [{ label: 'Fait maison', tone: 'orange' }],
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
          price: '5,00 €',
          photo: '/images/seed/soup.jpg',
          tags: [{ label: 'Fait maison', tone: 'orange' }],
          likes: 19,
        },
        {
          name: 'Café espresso',
          description: 'Torréfaction artisanale',
          price: '3,50 €',
          photo: '/images/seed/cremebrulee.jpg',
          tags: [{ label: 'Bio', tone: 'green' }],
          likes: 33,
        },
      ],
    },
  ],
  'Carte de la Semaine': [
    {
      title: 'Formule midi',
      items: [
        {
          name: 'Entrée + Plat + Dessert',
          description: 'Formule complète du lundi au vendredi',
          price: '24,00 €',
          photo: '/images/seed/fondant.jpg',
          tags: [{ label: 'De saison', tone: 'yellow' }],
          likes: 64,
        },
      ],
    },
  ],
};

const TAG_TONES = {
  green: { bg: 'rgba(34,197,94,0.14)', fg: '#15803d', icon: '🌱' },
  orange: { bg: 'rgba(249,115,22,0.14)', fg: '#c2410c', icon: '🏠' },
  red: { bg: 'rgba(239,68,68,0.14)', fg: '#b91c1c', icon: '🌶️' },
  yellow: { bg: 'rgba(234,179,8,0.16)', fg: '#a16207', icon: '🍂' },
} as const;

function TagBadge({ label, tone }: Tag) {
  const s = TAG_TONES[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <span aria-hidden>{s.icon}</span>
      {label}
    </span>
  );
}

function ItemCard({ item }: { item: Item }) {
  const [liked, setLiked] = useState(false);
  const likeCount = item.likes + (liked ? 1 : 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
          <Image src={item.photo} alt={item.name} fill className="object-cover" sizes="64px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-tight text-gray-900">
              {item.name}
            </p>
            <p className="shrink-0 text-sm font-bold text-gray-900">
              {item.price}
            </p>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-500">
            {item.description}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <TagBadge key={t.label} label={t.label} tone={t.tone} />
            ))}
          </div>
        </div>
      </div>

      {item.contains && item.contains.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-gray-400">Contient :</span>
          {item.contains.map((c) => (
            <span
              key={c}
              className="inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-500"
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-1.5">
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          aria-label={liked ? 'Retirer le like' : 'Aimer ce plat'}
          className="flex items-center gap-1.5 text-gray-400 transition-colors hover:text-rose-500"
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              liked && 'fill-rose-500 text-rose-500'
            )}
          />
          <span className="text-[10px] tabular-nums">{likeCount}</span>
        </button>
      </div>
    </div>
  );
}

export default function LiveMenu() {
  const [tab, setTab] = useState<Tab>('Plats');
  const categories = MENU[tab];

  return (
    <div className="flex h-full flex-col bg-[#faf7f2] text-left">
      {/* Top bar: status + logo + centered active tab title */}
      <div className="bg-[#faf7f2] px-4 pb-1 pt-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-gray-500">
          <span>9:41</span>
          <span>●●●</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/android-chrome-192x192.png"
            alt="MangeQR"
            width={32}
            height={32}
            className="h-8 w-8 rounded-xl"
          />
          <p className="flex-1 text-center text-sm font-bold text-gray-900">
            {tab}
          </p>
          <div className="h-8 w-8" aria-hidden />
        </div>
      </div>

      {/* Pill tabs */}
      <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 pt-1">
        {TABS.map((tItem) => (
          <button
            key={tItem}
            type="button"
            onClick={() => setTab(tItem)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold transition-colors',
              tab === tItem
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            )}
          >
            {tItem}
          </button>
        ))}
      </div>

      {/* Cover with the restaurant name overlaid */}
      <div className="relative mx-3 h-24 overflow-hidden rounded-2xl bg-gray-200">
        <Image
          src="/images/seed/cover.jpg"
          alt="The Plate"
          fill
          className="object-cover"
          sizes="320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-lg font-extrabold leading-tight text-white drop-shadow">
            The Plate
          </p>
          <p className="flex items-center gap-1 text-[10px] text-white/85">
            <MapPin className="h-3 w-3" /> Cuisine Italienne Authentique
          </p>
        </div>
      </div>

      {/* Suivez-nous bar */}
      <div className="mx-3 mt-2 flex items-center justify-between rounded-xl bg-white px-3 py-1.5 text-gray-400">
        <span className="text-[10px] font-medium">Suivez-nous</span>
        <div className="flex items-center gap-2.5 text-gray-500">
          <Instagram className="h-3.5 w-3.5" />
          <Facebook className="h-3.5 w-3.5" />
          <FaTiktok className="h-3 w-3" />
          <FaXTwitter className="h-3 w-3" />
          <Youtube className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Scrollable menu body */}
      <div className="mt-2 flex-1 space-y-3 overflow-y-auto px-3 pb-4">
        {categories.map((cat) => (
          <div key={cat.title} className="space-y-2">
            <p className="px-1 text-xs font-semibold text-gray-800">
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
