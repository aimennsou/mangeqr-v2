'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import { resolveTvConfig, type TvConfig } from '@/schemas';
import { cn } from '@/lib/utils';

interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo: string | null;
}
interface Category {
  id: string;
  name: string;
  dishes: Dish[];
}
interface Menu {
  id: string;
  name: string;
  categories: Category[];
}

export interface TvMenuBoardProps {
  name: string;
  currency: string;
  menus: Menu[];
  tvConfig: TvConfig | null;
}

/**
 * Full-screen TV menu board (public). A non-interactive, large-type digital
 * board for an in-room screen: restaurant/board title, then categories with
 * their dishes laid out in columns. Optionally auto-scrolls long boards and
 * cycles between multiple menus. Skinned by the owner's TvConfig.
 */
export function TvMenuBoard({ name, currency, menus, tvConfig }: TvMenuBoardProps) {
  const cfg = resolveTvConfig(tvConfig);
  const [menuIndex, setMenuIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dark = cfg.theme === 'dark';
  const title = cfg.title || name;

  // Cycle between menus every 20s when there is more than one available.
  useEffect(() => {
    if (menus.length <= 1) return;
    const t = setInterval(() => {
      setMenuIndex((i) => (i + 1) % menus.length);
    }, 20_000);
    return () => clearInterval(t);
  }, [menus.length]);

  // Gentle auto-scroll for boards taller than the screen; resets at the bottom.
  useEffect(() => {
    if (!cfg.autoScroll) return;
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    let paused = 0;
    const step = () => {
      if (paused > 0) {
        paused -= 1;
      } else if (el.scrollHeight > el.clientHeight) {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
          el.scrollTop = 0;
          paused = 120; // ~2s pause at the top
        } else {
          el.scrollTop += 0.6;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [cfg.autoScroll, menuIndex]);

  const menu = menus[menuIndex] ?? menus[0];

  const colClass =
    cfg.columns === 1
      ? 'columns-1'
      : cfg.columns === 3
        ? 'columns-1 md:columns-2 xl:columns-3'
        : 'columns-1 md:columns-2';

  return (
    <div
      className={cn(
        'flex h-screen w-screen flex-col overflow-hidden',
        dark ? 'bg-neutral-950 text-neutral-50' : 'bg-white text-neutral-900'
      )}
    >
      {/* Header */}
      <header
        className={cn(
          'flex items-center justify-between border-b px-10 py-6',
          dark ? 'border-white/10' : 'border-black/10'
        )}
      >
        <h1
          className="font-serif-display text-5xl font-light tracking-tight"
          style={{ color: cfg.accent }}
        >
          {title}
        </h1>
        {menu ? (
          <span
            className={cn(
              'text-2xl font-medium uppercase tracking-widest',
              dark ? 'text-white/60' : 'text-black/50'
            )}
          >
            {menu.name}
          </span>
        ) : null}
      </header>

      {/* Board */}
      <div ref={scrollRef} className="flex-1 overflow-hidden px-10 py-8">
        {!menu || menu.categories.length === 0 ? (
          <p className="mt-20 text-center text-3xl opacity-60">
            Aucun plat à afficher.
          </p>
        ) : (
          <div className={colClass}>
            {menu.categories.map((cat) => (
              <section key={cat.id} className="mb-10 break-inside-avoid">
                <h2
                  className="mb-4 border-b pb-2 text-3xl font-bold uppercase tracking-wide"
                  style={{ borderColor: cfg.accent }}
                >
                  {cat.name}
                </h2>
                <ul className="space-y-4">
                  {cat.dishes.map((dish) => (
                    <li key={dish.id} className="flex items-start gap-4">
                      {cfg.showPhotos && dish.photo ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={dish.photo}
                            alt={dish.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-2xl font-semibold">
                            {dish.name}
                          </span>
                          {cfg.showPrices ? (
                            <span
                              className="shrink-0 text-2xl font-bold tabular-nums"
                              style={{ color: cfg.accent }}
                            >
                              {dish.price} {currency}
                            </span>
                          ) : null}
                        </div>
                        {cfg.showDescriptions && dish.description ? (
                          <p
                            className={cn(
                              'mt-0.5 text-lg leading-snug',
                              dark ? 'text-white/60' : 'text-black/50'
                            )}
                          >
                            {dish.description}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
