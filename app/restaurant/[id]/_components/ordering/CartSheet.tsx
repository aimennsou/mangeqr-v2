'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Minus, Plus, Trash2, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { AppearanceTheme } from '@/lib/menu-appearance';
import type { CartLine, DinerTable } from './types';
import { lineTotal } from './types';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  currency: string;
  tables: DinerTable[];
  lines: CartLine[];
  theme: AppearanceTheme;
  accent: { color: string };
  labels: CartLabels;
  previewMode?: boolean;
  container?: HTMLElement | null;
  onChangeQty: (lineId: string, qty: number) => void;
  onRemove: (lineId: string) => void;
  onClear: () => void;
}

export interface CartLabels {
  title: string;
  empty: string;
  dineIn: string;
  delivery: string;
  chooseTable: string;
  name: string;
  phone: string;
  address: string;
  shareLocation: string;
  locationShared: string;
  note: string;
  notePlaceholder: string;
  total: string;
  submit: string;
  submitting: string;
  close: string;
  successTitle: string;
}

/**
 * Diner cart + checkout (FEAT-1). Review lines, pick DINE_IN (choose table) or
 * DELIVERY (name/phone + address or shared geolocation), optional order note,
 * then submit to POST /api/orders. On success routes the diner to the live
 * status page. Themed from the owner appearance.
 */
export function CartSheet({
  open,
  onOpenChange,
  restaurantId,
  currency,
  tables,
  lines,
  theme,
  accent,
  labels,
  previewMode = false,
  container,
  onChangeQty,
  onRemove,
  onClear
}: CartSheetProps) {
  const router = useRouter();
  const [type, setType] = useState<'DINE_IN' | 'DELIVERY'>('DINE_IN');
  const [tableId, setTableId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [note, setNote] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = lines.reduce((s, l) => s + lineTotal(l), 0);
  const fmt = (n: number) =>
    (Number.isInteger(n) ? n.toString() : n.toFixed(2)) + ' ' + currency;

  const shareLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('La géolocalisation n’est pas disponible.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError('Impossible d’obtenir votre position.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async () => {
    setError(null);
    if (lines.length === 0) return;

    // Lightweight client-side guards (server re-validates).
    if (type === 'DINE_IN' && !tableId) {
      setError('Sélectionnez votre table.');
      return;
    }
    if (type === 'DELIVERY') {
      if (!name.trim() || !phone.trim()) {
        setError('Nom et téléphone requis.');
        return;
      }
      if (!address.trim() && !coords) {
        setError('Adresse ou position requise.');
        return;
      }
    }

    const payload = {
      restaurantId,
      type,
      tableId: type === 'DINE_IN' ? tableId : null,
      customerName: type === 'DELIVERY' ? name.trim() : '',
      customerPhone: type === 'DELIVERY' ? phone.trim() : '',
      address: type === 'DELIVERY' ? address.trim() : '',
      latitude: type === 'DELIVERY' ? coords?.lat ?? null : null,
      longitude: type === 'DELIVERY' ? coords?.lng ?? null : null,
      note: note.trim(),
      items: lines.map((l) => ({
        dishId: l.dishId,
        quantity: l.quantity,
        optionIds: l.options.map((o) => o.id),
        specialRequest: l.specialRequest
      }))
    };

    try {
      setSubmitting(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Une erreur est survenue.');
        return;
      }
      onClear();
      onOpenChange(false);
      // In preview mode we can't route; the real diner route navigates to the
      // live status page keyed by the order id.
      if (!previewMode) {
        router.push(`/order/${data.id}`);
      }
    } catch {
      setError('Une erreur réseau est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const positionClass = previewMode ? 'absolute' : 'fixed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal container={previewMode ? container ?? undefined : undefined}>
        <DialogOverlay className={cn(previewMode && 'absolute')} />
        <DialogPrimitive.Content
          className={cn(
            positionClass,
            'left-[50%] top-[50%] z-50 grid max-h-[90vh] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto rounded-2xl border p-5 shadow-lg'
          )}
          style={{
            backgroundColor: theme.background,
            borderColor: theme.border,
            color: theme.text
          }}
        >
          <DialogPrimitive.Title className="text-lg font-bold" style={accent}>
            {labels.title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {labels.title}
          </DialogPrimitive.Description>

          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: theme.muted }}>
              {labels.empty}
            </p>
          ) : (
            <>
              {/* Lines */}
              <div className="space-y-3">
                {lines.map((l) => (
                  <div
                    key={l.lineId}
                    className="rounded-lg border p-3"
                    style={{ borderColor: theme.border }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{l.dishName}</p>
                        {l.options.length > 0 ? (
                          <p className="text-xs" style={{ color: theme.muted }}>
                            {l.options.map((o) => o.name).join(', ')}
                          </p>
                        ) : null}
                        {l.specialRequest ? (
                          <p
                            className="text-xs italic"
                            style={{ color: theme.muted }}
                          >
                            “{l.specialRequest}”
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        aria-label="remove"
                        onClick={() => onRemove(l.lineId)}
                        style={{ color: theme.muted }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div
                        className="flex items-center gap-2 rounded-full border px-2 py-0.5"
                        style={{ borderColor: theme.border }}
                      >
                        <button
                          type="button"
                          aria-label="-"
                          onClick={() =>
                            onChangeQty(l.lineId, Math.max(1, l.quantity - 1))
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm">
                          {l.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="+"
                          onClick={() =>
                            onChangeQty(l.lineId, Math.min(99, l.quantity + 1))
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold" style={accent}>
                        {fmt(lineTotal(l))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order type toggle */}
              <div
                className="flex rounded-full border p-1"
                style={{ borderColor: theme.border }}
              >
                {(['DINE_IN', 'DELIVERY'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                    style={
                      type === t
                        ? { backgroundColor: theme.accent, color: theme.onAccent }
                        : { color: theme.muted }
                    }
                  >
                    {t === 'DINE_IN' ? labels.dineIn : labels.delivery}
                  </button>
                ))}
              </div>

              {/* Dine-in: table picker */}
              {type === 'DINE_IN' ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">
                    {labels.chooseTable}
                  </label>
                  {tables.length === 0 ? (
                    <p className="text-xs" style={{ color: theme.muted }}>
                      —
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tables.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTableId(t.id)}
                          className="min-w-[44px] rounded-lg border px-3 py-2 text-sm font-medium"
                          style={
                            tableId === t.id
                              ? {
                                  backgroundColor: theme.accent,
                                  color: theme.onAccent,
                                  borderColor: theme.accent
                                }
                              : { borderColor: theme.border, color: theme.text }
                          }
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Delivery: contact + destination */
                <div className="space-y-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={labels.name}
                    className="w-full rounded-lg border bg-transparent p-2 text-sm outline-none"
                    style={{ borderColor: theme.border, color: theme.text }}
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={labels.phone}
                    inputMode="tel"
                    className="w-full rounded-lg border bg-transparent p-2 text-sm outline-none"
                    style={{ borderColor: theme.border, color: theme.text }}
                  />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={labels.address}
                    rows={2}
                    className="w-full resize-none rounded-lg border bg-transparent p-2 text-sm outline-none"
                    style={{ borderColor: theme.border, color: theme.text }}
                  />
                  <button
                    type="button"
                    onClick={shareLocation}
                    disabled={locating}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm"
                    style={{
                      borderColor: coords ? theme.accent : theme.border,
                      color: coords ? theme.accent : theme.text
                    }}
                  >
                    {locating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    {coords ? labels.locationShared : labels.shareLocation}
                  </button>
                </div>
              )}

              {/* Order note */}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={labels.notePlaceholder}
                rows={2}
                className="w-full resize-none rounded-lg border bg-transparent p-2 text-sm outline-none"
                style={{ borderColor: theme.border, color: theme.text }}
              />

              {error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : null}

              {/* Total + submit */}
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: theme.muted }}>
                  {labels.total}
                </span>
                <span className="text-lg font-bold" style={accent}>
                  {fmt(total)}
                </span>
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: theme.accent, color: theme.onAccent }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {labels.submitting}
                  </>
                ) : (
                  labels.submit
                )}
              </button>
            </>
          )}

          <DialogPrimitive.Close
            aria-label={labels.close}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full opacity-90 hover:opacity-100"
            style={{ backgroundColor: theme.surface, color: theme.text }}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
