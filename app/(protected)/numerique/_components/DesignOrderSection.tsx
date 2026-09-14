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

// A small CSS-rendered mockup of each design so no image assets are needed.
function DesignPreview({ product }: { product: DesignProduct }) {
  const shapeClass =
    product.shape === 'disc'
      ? 'rounded-full'
      : product.shape === 'sticker'
        ? 'rounded-2xl'
        : 'rounded-md';

  return (
    <div
      className={cn(
        'relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 p-4',
        product.shape === 'disc' && 'aspect-square',
        product.shape === 'sticker' && 'aspect-square',
        shapeClass,
        product.previewClass
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
        Menu
      </span>
      {/* Fake QR grid */}
      <div className="grid grid-cols-4 gap-0.5">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-3 w-3 rounded-[1px]',
              // deterministic checker pattern so it reads as a QR code
              (i * 7 + 3) % 3 === 0 ? 'bg-current' : 'bg-current/20'
            )}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-lg">
        {product.accents.map((a, i) => (
          <span key={i}>{a}</span>
        ))}
      </div>
      <span className="text-[10px] opacity-80">Scannez le QR code</span>
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
                'group relative flex flex-col overflow-hidden rounded-xl border bg-card p-4 text-left transition-all',
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
