'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types';
import {
  DESIGN_PRODUCTS,
  getDeliveryOptions,
  isAlgerianCurrency,
  type DesignProduct,
} from '@/config';
import { createDesignOrder } from '@/actions/design-order';

/**
 * "Commander un design" section of the Menu numérique page.
 *
 * Resolves the active restaurant via the owner-scoped GET /api/magasin (same as
 * the QR / Apparence sections), lets the restaurateur browse the physical
 * QR-code design catalog, pick one, and place an order through the
 * `createDesignOrder` server action.
 */

// A deterministic 7x7 QR-ish matrix (stable pattern, three finder squares) so
// every mockup renders a plausible QR code without an image asset.
const QR_CELLS = Array.from({ length: 49 }, (_, i) => {
  const r = Math.floor(i / 7);
  const c = i % 7;
  const finder =
    (r < 3 && c < 3) || (r < 3 && c > 3) || (r > 3 && c < 3); // 3 corner eyes
  if (finder) {
    const rr = r % 4;
    const cc = c % 4;
    return rr === 0 || rr === 2 || cc === 0 || cc === 2; // ring look
  }
  return (i * 5 + 2) % 3 === 0;
});

/**
 * A small QR block. `tone` controls whether the "dark" modules are ink (poster/
 * sticker) or an engraved recess (wood). Rendered as a CSS grid so no assets
 * are needed.
 */
function QrBlock({
  className,
  cellClass,
  onClass,
  offClass,
}: {
  className?: string;
  cellClass?: string;
  onClass: string;
  offClass: string;
}) {
  return (
    <div className={cn('grid grid-cols-7 gap-[2px]', className)}>
      {QR_CELLS.map((on, i) => (
        <span
          key={i}
          className={cn('rounded-[1px]', cellClass, on ? onClass : offClass)}
        />
      ))}
    </div>
  );
}

/**
 * Per-support CSS mockups of each physical QR design — an elegant black/gold
 * poster, a laser-engraved wooden disc, and a die-cut table sticker. Each is a
 * distinct, plausible product rather than the same flat card.
 */
function DesignPreview({ product }: { product: DesignProduct }) {
  // Wooden laser-engraved medallion.
  if (product.shape === 'disc') {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center">
        {/* Wood medallion: radial grain + a darker rim like a lathed edge */}
        <div
          className="relative flex h-full w-full flex-col items-center justify-center rounded-full p-5 shadow-inner"
          style={{
            background:
              'radial-gradient(circle at 38% 30%, #d9a86a 0%, #c8914e 38%, #a9702f 72%, #8a561f 100%)',
            boxShadow:
              'inset 0 2px 6px rgba(255,236,200,0.45), inset 0 -6px 16px rgba(80,45,15,0.55), 0 2px 8px rgba(80,45,15,0.25)',
          }}
        >
          {/* Wood grain streaks */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full opacity-40 mix-blend-multiply"
            style={{
              background:
                'repeating-radial-gradient(circle at 42% 34%, rgba(120,70,25,0) 0px, rgba(120,70,25,0) 5px, rgba(120,70,25,0.25) 6px, rgba(120,70,25,0) 8px)',
            }}
          />
          {/* Hanging hole */}
          <span
            className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full"
            style={{ background: 'rgba(80,45,15,0.6)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}
          />
          <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#5a3a17]/90">
            Menu
          </span>
          {/* Engraved QR: recessed dark modules on the burnt-wood tone */}
          <QrBlock
            className="my-2 w-[52%]"
            cellClass="aspect-square"
            onClass="bg-[#4a2f13] shadow-[inset_0_1px_1px_rgba(0,0,0,0.6)]"
            offClass="bg-transparent"
          />
          <span className="text-[7px] uppercase tracking-widest text-[#5a3a17]/80">
            Scannez
          </span>
        </div>
      </div>
    );
  }

  // Die-cut table sticker.
  if (product.shape === 'sticker') {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center p-2">
        {/* Cut line (dashed) around a rounded red sticker */}
        <div className="absolute inset-1 rounded-2xl border border-dashed border-red-300" />
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-4 text-white shadow-md">
          {/* Peel corner */}
          <span className="absolute right-0 top-0 h-5 w-5 rounded-bl-2xl rounded-tr-2xl bg-white/25" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
            Scan &amp; Menu
          </span>
          <div className="rounded-md bg-white p-1.5">
            <QrBlock
              className="w-16"
              cellClass="aspect-square"
              onClass="bg-neutral-900"
              offClass="bg-transparent"
            />
          </div>
          <span className="text-[7px] font-medium uppercase tracking-widest text-white/90">
            Notre carte
          </span>
        </div>
      </div>
    );
  }

  // Elegant black & gold poster (default / menu-sheet).
  return (
    <div className="relative flex aspect-[3/4] w-full items-center justify-center">
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-md bg-gradient-to-b from-neutral-900 to-black p-4">
        {/* Inner gold hairline frame */}
        <div className="pointer-events-none absolute inset-2 rounded-sm border border-amber-300/40" />
        <span className="text-[8px] font-medium uppercase tracking-[0.35em] text-amber-300/80">
          Le Restaurant
        </span>
        <span className="font-serif-display text-lg font-medium leading-none text-amber-200">
          Menu
        </span>
        <span className="h-px w-8 bg-amber-300/50" />
        {/* Ink QR on a white plaque */}
        <div className="rounded-[3px] bg-white p-1.5">
          <QrBlock
            className="w-14"
            cellClass="aspect-square"
            onClass="bg-neutral-900"
            offClass="bg-transparent"
          />
        </div>
        <span className="text-[7px] uppercase tracking-[0.2em] text-amber-100/70">
          Scannez le QR code
        </span>
      </div>
    </div>
  );
}

export default function DesignOrderSection() {
  const { theme } = useTheme();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');

  const [selectedDesign, setSelectedDesign] = useState<string>(
    DESIGN_PRODUCTS[0]?.id ?? ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [notes, setNotes] = useState('');

  const [isPending, startTransition] = useTransition();

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

  const selectedProduct = useMemo(
    () => DESIGN_PRODUCTS.find((d) => d.id === selectedDesign),
    [selectedDesign]
  );

  // Delivery options depend on the selected restaurant's country (currency).
  // Algeria (DINAR) is restricted to a single option: Yalidine bureau.
  const selectedRestaurant = useMemo(
    () => restaurants.find((r) => r.id === selectedId),
    [restaurants, selectedId]
  );
  const deliveryOptions = useMemo(
    () => getDeliveryOptions(selectedRestaurant?.currency),
    [selectedRestaurant]
  );
  const algeriaOnly = isAlgerianCurrency(selectedRestaurant?.currency);

  // Keep the chosen delivery method valid for the current restaurant: when the
  // options change (restaurant switch) and the current value is no longer
  // offered, default to the first one (also auto-selects Algeria's sole option).
  useEffect(() => {
    if (!deliveryOptions.some((o) => o.id === deliveryMethod)) {
      setDeliveryMethod(deliveryOptions[0]?.id ?? '');
    }
  }, [deliveryOptions, deliveryMethod]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedId) {
      toast.error('Sélectionnez un restaurant.');
      return;
    }
    if (!selectedDesign) {
      toast.error('Sélectionnez un design.');
      return;
    }

    startTransition(() => {
      createDesignOrder({
        restaurantId: selectedId,
        designId: selectedDesign,
        quantity,
        contactName,
        contactEmail,
        contactPhone,
        deliveryMethod,
        notes,
      })
        .then((data) => {
          if (data?.error) {
            toast.error(data.error);
            return;
          }
          if (data?.success) {
            toast.success(data.success);
            // Reset the free-text fields; keep the selected restaurant/design.
            setQuantity(1);
            setContactName('');
            setContactEmail('');
            setContactPhone('');
            setNotes('');
          }
        })
        .catch(() => toast.error('Une erreur est survenue.'));
    });
  };

  if (loading) {
    return <div className="text-center text-muted-foreground py-16">Chargement...</div>;
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
        <p className="text-lg font-semibold mt-4">Aucun restaurant disponible.</p>
        <p className="mt-2">
          Créez votre premier restaurant pour commander un design de QR code.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h3 className="font-serif-display text-2xl font-light tracking-tight text-foreground">Commander un design de QR code</h3>
        <p className="text-sm text-muted-foreground">
          Choisissez un support physique pour votre QR code. Notre équipe
          prépare et vous livre le design personnalisé de votre restaurant.
        </p>
      </div>

      {/* Design gallery */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DESIGN_PRODUCTS.map((product) => {
          const active = product.id === selectedDesign;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => setSelectedDesign(product.id)}
              aria-pressed={active}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 text-left transition-colors',
                active
                  ? 'border-yellow-400 ring-2 ring-yellow-400/40'
                  : 'hover:border-yellow-400/60'
              )}
            >
              {active && (
                <span className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-black">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <div className="mb-3 flex flex-1 items-center justify-center">
                <div className="w-40">
                  <DesignPreview product={product} />
                </div>
              </div>
              <p className="font-semibold">{product.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {product.description}
              </p>
              <p className="mt-2 text-sm font-medium text-yellow-600">
                {product.price}
              </p>
            </button>
          );
        })}
      </div>

      {/* Order form */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-border bg-card p-6"
      >
        <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
          Votre commande
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
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

          <div className="grid gap-2">
            <Label htmlFor="design-quantity">Quantité</Label>
            <Input
              id="design-quantity"
              type="number"
              min={1}
              max={1000}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="design-contact-name">Nom de contact</Label>
            <Input
              id="design-contact-name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="design-contact-email">Email de contact</Label>
            <Input
              id="design-contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@restaurant.com"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="design-contact-phone">
              Téléphone (optionnel)
            </Label>
            <Input
              id="design-contact-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+41 79 000 00 00"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label>Mode de livraison</Label>
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Choisissez un mode de livraison" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {deliveryOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label} — {o.price}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {algeriaOnly && (
              <p className="text-xs text-muted-foreground">
                Livraison via Yalidine bureau (400 DZD) pour l&apos;Algérie.
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="design-notes">Notes (optionnel)</Label>
            <Textarea
              id="design-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Précisions sur votre commande, couleurs, logo, délais…"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Design sélectionné :{' '}
            <span className="font-medium text-foreground">
              {selectedProduct?.name ?? '—'}
            </span>
          </p>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-yellow-400 text-black hover:bg-yellow-400/90"
          >
            {isPending ? 'Envoi…' : 'Commander ce design'}
          </Button>
        </div>
      </form>
    </div>
  );
}
