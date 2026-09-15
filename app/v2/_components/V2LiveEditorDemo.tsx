'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChefHat,
  ChevronLeft,
  Flame,
  GripVertical,
  Heart,
  Instagram,
  Leaf,
  MapPin,
  Minus,
  Plus,
  Settings,
  Sun
} from 'lucide-react';
import { FaTiktok } from 'react-icons/fa6';

import { cn } from '@/lib/utils';
import PhoneFrame from '../../(landing)/_components/ui/PhoneFrame';

type Tone = 'green' | 'orange' | 'red' | 'yellow';
type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  photo: string;
  tags: { label: string; tone: Tone }[];
  likes: number;
};

const INITIAL: Dish[] = [
  {
    id: 'd1',
    name: 'Bruschetta',
    description: 'Tomates fraîches, basilic',
    price: 7.5,
    available: true,
    photo: '/images/seed/bruschetta.jpg',
    tags: [{ label: 'Végétarien', tone: 'green' }],
    likes: 53
  },
  {
    id: 'd2',
    name: 'Risotto aux cèpes',
    description: 'Parmesan, huile de truffe',
    price: 16,
    available: true,
    photo: '/images/seed/risotto.jpg',
    tags: [{ label: 'Fait maison', tone: 'orange' }],
    likes: 41
  },
  {
    id: 'd3',
    name: 'Tiramisu maison',
    description: 'Café, mascarpone, cacao',
    price: 6.5,
    available: true,
    photo: '/images/seed/cremebrulee.jpg',
    tags: [{ label: 'De saison', tone: 'yellow' }],
    likes: 28
  }
];

const TAG_TONES: Record<Tone, { bg: string; fg: string; icon: typeof Leaf }> = {
  green: { bg: 'rgba(34,197,94,0.14)', fg: '#15803d', icon: Leaf },
  orange: { bg: 'rgba(249,115,22,0.14)', fg: '#c2410c', icon: ChefHat },
  red: { bg: 'rgba(239,68,68,0.14)', fg: '#b91c1c', icon: Flame },
  yellow: { bg: 'rgba(234,179,8,0.16)', fg: '#a16207', icon: Sun }
};

const eur = (n: number) =>
  `${Number.isInteger(n) ? n.toString() : n.toFixed(2)} €`;

/** A draggable editor dish row. The grip handle carries the drag listeners so
 * the price stepper and availability toggle stay clickable. */
function SortableDishRow({
  dish,
  onPrice,
  onToggle
}: {
  dish: Dish;
  onPrice: (id: string, delta: number) => void;
  onToggle: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: dish.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.9 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-xl border bg-background p-3',
        isDragging ? 'border-yellow-400 shadow-lg' : 'border-border'
      )}
    >
      <button
        type="button"
        aria-label="Réordonner"
        className="shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {dish.name}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {dish.description}
        </p>
      </div>

      {/* Price stepper */}
      <div className="flex items-center gap-1 rounded-lg border border-border">
        <button
          type="button"
          aria-label="Baisser le prix"
          onClick={() => onPrice(dish.id, -0.5)}
          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-14 text-center text-xs font-medium tabular-nums text-foreground">
          {eur(dish.price)}
        </span>
        <button
          type="button"
          aria-label="Augmenter le prix"
          onClick={() => onPrice(dish.id, 0.5)}
          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Availability toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={dish.available}
        aria-label={`${dish.name} disponible`}
        onClick={() => onToggle(dish.id)}
        className={cn(
          'flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
          dish.available ? 'bg-yellow-400' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'h-5 w-5 rounded-full bg-white shadow transition-transform',
            dish.available ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDishes((prev) => {
      const oldIndex = prev.findIndex((d) => d.id === active.id);
      const newIndex = prev.findIndex((d) => d.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

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

          {/* Dish rows — drag the grip to reorder; the preview follows. */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={dishes.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {dishes.map((d) => (
                  <SortableDishRow
                    key={d.id}
                    dish={d}
                    onPrice={changePrice}
                    onToggle={toggleDish}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <p className="px-1 pt-1 text-[11px] text-muted-foreground">
            Réorganisez, modifiez le prix, marquez un plat « épuisé » ou mettez
            la carte hors ligne — l&apos;aperçu se met à jour instantanément.
          </p>
        </div>
      </div>

      {/* ---- Live diner preview (mirrors the real LiveMenu) ---- */}
      <div className="flex items-center justify-center">
        <PhoneFrame>
          <div className="flex h-full flex-col bg-[#faf7f2] text-left">
            {/* Top bar: status + centered title (mirrors LiveMenu) */}
            <div className="bg-[#faf7f2] px-4 pb-1 pt-3">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-gray-500">
                <span>9:41</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[9px] font-semibold',
                    online
                      ? 'bg-green-100 text-green-700'
                      : 'bg-neutral-200 text-neutral-500'
                  )}
                >
                  {online ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
              <p className="text-center text-sm font-bold text-gray-900">
                Menu du Midi
              </p>
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

              <div className="h-full overflow-y-auto pb-4">
                {/* Cover with name overlaid */}
                <div className="relative mx-3 h-24 overflow-hidden rounded-2xl bg-gray-200">
                  <Image
                    src="/images/seed/cover.jpg"
                    alt="Le Bistrot"
                    fill
                    className="object-cover"
                    sizes="280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-lg font-extrabold leading-tight text-white drop-shadow">
                      Le Bistrot
                    </p>
                    <p className="flex items-center gap-1 text-[10px] text-white/85">
                      <MapPin className="h-3 w-3" /> Cuisine française
                    </p>
                  </div>
                </div>

                {/* Suivez-nous bar */}
                <div className="mx-3 mt-2 flex items-center justify-between rounded-xl bg-white px-3 py-1.5 text-gray-400">
                  <span className="text-[10px] font-medium">Suivez-nous</span>
                  <div className="flex items-center gap-2.5 text-gray-500">
                    <Instagram className="h-3.5 w-3.5" />
                    <FaTiktok className="h-3 w-3" />
                  </div>
                </div>

                {/* Category heading */}
                <div className="mx-3 mt-3 flex items-center gap-2 px-1">
                  <p className="text-sm font-bold tracking-tight text-gray-900">
                    Entrées &amp; plats
                  </p>
                  <span className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Dish cards (live-edited) */}
                <div className="mx-3 mt-2 space-y-2">
                  {dishes.map((d) => (
                    <div
                      key={d.id}
                      className={cn(
                        'rounded-2xl border bg-white p-3 transition-opacity',
                        d.available
                          ? 'border-gray-200'
                          : 'border-dashed border-neutral-300 opacity-60'
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          <Image
                            src={d.photo}
                            alt={d.name}
                            fill
                            className={cn('object-cover', !d.available && 'grayscale')}
                            sizes="60px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] font-semibold leading-snug text-gray-900">
                                {d.name}
                              </p>
                              {!d.available ? (
                                <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-neutral-500">
                                  Épuisé
                                </span>
                              ) : null}
                            </div>
                            <p
                              className={cn(
                                'shrink-0 text-[13px] font-bold tabular-nums text-gray-900',
                                !d.available && 'line-through'
                              )}
                            >
                              {eur(d.price)}
                            </p>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[11px] leading-relaxed text-gray-500">
                            {d.description}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {d.tags.map((tag) => {
                              const s = TAG_TONES[tag.tone];
                              const TagIcon = s.icon;
                              return (
                                <span
                                  key={tag.label}
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                  style={{ backgroundColor: s.bg, color: s.fg }}
                                >
                                  <TagIcon className="h-2.5 w-2.5" aria-hidden />
                                  {tag.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-gray-400">
                        <Heart className="h-4 w-4" />
                        <span className="text-[10px] tabular-nums">{d.likes}</span>
                      </div>
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
