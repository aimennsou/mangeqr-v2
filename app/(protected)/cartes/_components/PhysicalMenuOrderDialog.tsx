'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Check,
  BookOpen,
  FileText,
  Layers,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';

// Real lucide icons per printed format (never emoji). Keyed by product id for
// clear distinctions: A4 sheet / laminated / booklet.
const PRODUCT_ICON: Record<string, LucideIcon> = {
  'printed-menu-a4': FileText,
  'laminated-menu': Layers,
  'menu-booklet': BookOpen,
};

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  PHYSICAL_MENU_PRODUCTS,
  getDeliveryOptions,
  isAlgerianCurrency,
} from '@/config';
import type { PhysicalMenuData } from '../_templates/types';
import TemplateThumbnail from './TemplateThumbnail';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createDesignOrder } from '@/actions/design-order';

/**
 * Lets the restaurateur order a professionally printed run of the physical menu
 * they are previewing on the cartes page. Reuses the shared `createDesignOrder`
 * server action (same order pipeline as the QR-code designs), with the printed
 * menu format chosen from `PHYSICAL_MENU_PRODUCTS`.
 */
export default function PhysicalMenuOrderDialog({
  restaurantId,
  menuName,
  currency,
  disabled,
  templateId,
  templateLabel,
  menuData,
}: {
  restaurantId: string;
  menuName?: string;
  /** Restaurant currency; drives the available delivery options (DINAR => Algeria). */
  currency?: string | null;
  disabled?: boolean;
  /** The visual template selected on the design tab (what gets printed). */
  templateId?: string;
  templateLabel?: string;
  /** Menu data used to render the design preview inside the dialog. */
  menuData?: PhysicalMenuData | null;
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(PHYSICAL_MENU_PRODUCTS[0]?.id ?? '');
  const [quantity, setQuantity] = useState(50);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  // Delivery options depend on the restaurant's country (currency). Algeria
  // (DINAR) is restricted to Yalidine bureau only.
  const deliveryOptions = getDeliveryOptions(currency);
  const algeriaOnly = isAlgerianCurrency(currency);
  const [deliveryMethod, setDeliveryMethod] = useState(
    deliveryOptions[0]?.id ?? ''
  );

  // Keep the delivery method valid if the restaurant (currency) changes.
  useEffect(() => {
    if (!deliveryOptions.some((o) => o.id === deliveryMethod)) {
      setDeliveryMethod(deliveryOptions[0]?.id ?? '');
    }
  }, [deliveryOptions, deliveryMethod]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!restaurantId) {
      toast.error('Sélectionnez un restaurant.');
      return;
    }
    if (!productId) {
      toast.error('Sélectionnez un format.');
      return;
    }

    // Prefix the notes with the menu + design context so the team knows exactly
    // which menu and which visual template to print.
    const menuNote = menuName ? `Menu à imprimer : « ${menuName} ». ` : '';
    const designNote = templateLabel ? `Design : « ${templateLabel} ». ` : '';
    const contextNote = `${menuNote}${designNote}`;

    startTransition(() => {
      createDesignOrder({
        restaurantId,
        designId: productId,
        quantity,
        contactName,
        contactEmail,
        contactPhone,
        deliveryMethod,
        notes: `${contextNote}${notes}`.trim(),
      })
        .then((data) => {
          if (data?.error) {
            toast.error(data.error);
            return;
          }
          if (data?.success) {
            toast.success(data.success);
            setOpen(false);
            setQuantity(50);
            setContactName('');
            setContactEmail('');
            setContactPhone('');
            setNotes('');
          }
        })
        .catch(() => toast.error('Une erreur est survenue.'));
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <ShoppingCart className="mr-2 h-4 w-4" /> Commander l&apos;impression
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="font-serif-display text-2xl font-medium tracking-tight">
            Commander l&apos;impression du menu
          </DialogTitle>
          <DialogDescription>
            Faites imprimer professionnellement la carte que vous avez conçue.
            {menuName ? ` Menu sélectionné : « ${menuName} ».` : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[calc(90vh-8rem)] flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Selected design preview — shows exactly which visual template will
              be printed (chosen on the "Concevoir & télécharger" tab). */}
          {templateId && menuData ? (
            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/40 p-3">
              <div className="shrink-0 overflow-hidden rounded-md border border-border shadow-sm">
                <TemplateThumbnail
                  templateId={templateId}
                  data={menuData}
                  width={96}
                  heightRatio={0.7}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
                  Design sélectionné
                </p>
                <p className="mt-0.5 truncate font-semibold text-foreground">
                  {templateLabel ?? '—'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Modifiable dans l&apos;onglet « Concevoir &amp; télécharger ».
                </p>
              </div>
            </div>
          ) : null}

          {/* Format picker */}
          <div className="grid gap-2">
            <Label>Format d&apos;impression</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {PHYSICAL_MENU_PRODUCTS.map((p) => {
                const active = p.id === productId;
                const Icon = PRODUCT_ICON[p.id] ?? FileText;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProductId(p.id)}
                    aria-pressed={active}
                    className={cn(
                      'relative rounded-xl border p-3 text-left transition-colors',
                      active
                        ? 'border-yellow-400 ring-2 ring-yellow-400/40'
                        : 'border-border hover:border-yellow-400/60'
                    )}
                  >
                    {active && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-black">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <p className="mt-3 text-sm font-semibold leading-tight">
                      {p.name}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{p.price}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="pm-qty">Quantité</Label>
              <Input
                id="pm-qty"
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
              <Label htmlFor="pm-name">Nom de contact</Label>
              <Input
                id="pm-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pm-email">Email de contact</Label>
              <Input
                id="pm-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@restaurant.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pm-phone">Téléphone (optionnel)</Label>
              <Input
                id="pm-phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+41 79 000 00 00"
              />
            </div>
          </div>

          <div className="grid gap-2">
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

          <div className="grid gap-2">
            <Label htmlFor="pm-notes">Notes (optionnel)</Label>
            <Textarea
              id="pm-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type de papier, finition, délais souhaités…"
            />
          </div>

          </div>

          <div className="border-t border-border px-6 py-4">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
            >
              {isPending ? 'Envoi…' : 'Envoyer la commande'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
