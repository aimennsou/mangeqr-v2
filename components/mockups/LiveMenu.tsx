'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ChefHat,
  Facebook,
  Flame,
  Heart,
  Instagram,
  Leaf,
  MapPin,
  Sun,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
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

const TAG_TONES: Record<Tag['tone'], { bg: string; fg: string; icon: LucideIcon }> = {
  green: { bg: 'rgba(34,197,94,0.14)', fg: '#15803d', icon: Leaf },
  orange: { bg: 'rgba(249,115,22,0.14)', fg: '#c2410c', icon: ChefHat },
  red: { bg: 'rgba(239,68,68,0.14)', fg: '#b91c1c', icon: Flame },
  yellow: { bg: 'rgba(234,179,8,0.16)', fg: '#a16207', icon: Sun },
};

function TagBadge({ label, tone }: Tag) {
  const s = TAG_TONES[tone];
  const TagIcon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <TagIcon className="h-2.5 w-2.5" aria-hidden />
      {label}
    </span>
  );
}

function ItemCard({ item }: { item: Item }) {
  const [liked, setLiked] = useState(false);
  const likeCount = item.likes + (liked ? 1 : 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3">
      <div className="flex gap-3">
        <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-gray-100">
          <Image src={item.photo} alt={item.name} fill className="object-cover" sizes="68px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold leading-snug text-gray-900">
              {item.name}
            </p>
            <p className="shrink-0 text-[13px] font-bold tabular-nums text-gray-900">
              {item.price}
            </p>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
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

      <div className="mt-2.5">
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

  // Scrollable body ref + the category currently at the top (sticky header).
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0]?.title ?? ''
  );

  // Reset the active category when the tab changes.
  useEffect(() => {
    setActiveCategory(categories[0]?.title ?? '');
  }, [tab, categories]);

  // Track which category heading is at the top of the scroll container.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const headings =
        container.querySelectorAll<HTMLElement>('[data-cat-anchor]');
      let current = categories[0]?.title ?? '';
      const top = container.getBoundingClientRect().top;
      headings.forEach((h) => {
        if (h.getBoundingClientRect().top - top <= 8) {
          current = h.dataset.catAnchor ?? current;
        }
      });
      setActiveCategory(current);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [categories]);

  const scrollToCategory = (title: string) => {
    const container = scrollRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(
      `[data-cat-anchor="${title}"]`
    );
    if (!el) return;
    const top =
      el.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      4;
    container.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="flex h-full flex-col bg-[#faf7f2] text-left">
      {/* Top bar: status + centered active tab title (no logo — attribution
          moved to a "Powered by" footer, mirroring the diner menu). */}
      <div className="bg-[#faf7f2] px-4 pb-1 pt-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-gray-500">
          <span>9:41</span>
          <span>●●●</span>
        </div>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-center text-sm font-bold text-gray-900">
            {tab}
          </p>
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
      <div ref={scrollRef} className="relative mt-2 flex-1 overflow-y-auto pb-4">
        {/* Sticky category chips — pinned at the top of the scroll body; shows
            ALL categories, highlights the current one, tap any to jump. */}
        <div className="sticky top-0 z-10 flex gap-1.5 overflow-x-auto bg-[#faf7f2]/90 px-3 py-1.5 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => {
            const isActive = cat.title === activeCategory;
            return (
              <button
                key={cat.title}
                type="button"
                onClick={() => scrollToCategory(cat.title)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors',
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-100'
                )}
              >
                {cat.title}
              </button>
            );
          })}
        </div>

        <div className="space-y-3 px-3">
          {categories.map((cat) => (
            <div key={cat.title} className="space-y-2">
              <div
                data-cat-anchor={cat.title}
                className="flex scroll-mt-8 items-center gap-2 px-1"
              >
                <p className="text-sm font-bold tracking-tight text-gray-900">
                  {cat.title}
                </p>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              {cat.items.map((item) => (
                <ItemCard key={item.name} item={item} />
              ))}
            </div>
          ))}

          {/* Powered by MangeQR footer */}
          <div className="pt-3 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
              <Image
                src="/android-chrome-192x192.png"
                alt="MangeQR"
                width={12}
                height={12}
                className="h-3 w-3 rounded"
              />
              Propulsé par MangeQR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
