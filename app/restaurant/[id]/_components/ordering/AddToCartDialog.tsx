'use client';

import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Minus, Plus, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { Dialog, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { AppearanceTheme } from '@/lib/menu-appearance';
import type { CartLine, OrderableDish } from './types';

interface AddToCartDialogProps {
  dish: OrderableDish | null;
  currency: string;
  theme: AppearanceTheme;
  accent: { color: string };
  labels: {
    addToCart: string;
    quantity: string;
    specialRequest: string;
    specialRequestPlaceholder: string;
    required: string;
    close: string;
  };
  previewMode?: boolean;
  container?: HTMLElement | null;
  onOpenChange: (open: boolean) => void;
  onAdd: (line: CartLine) => void;
}

/**
 * Diner add-to-cart dialog (FEAT-1). Lets the diner pick add-on options
 * (SINGLE = radio-like, MULTI = checkboxes), set a quantity, and add a special
 * request, then adds a resolved CartLine. Themed from the owner appearance so
 * it matches the rest of the diner menu.
 */
export function AddToCartDialog({
  dish,
  currency,
  theme,
  accent,
  labels,
  previewMode = false,
  container,
  onOpenChange,
  onAdd
}: AddToCartDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [specialRequest, setSpecialRequest] = useState('');

  // Reset the form each time a new dish is opened.
  useEffect(() => {
    if (dish) {
      setQuantity(1);
      setSpecialRequest('');
      setSelected({});
    }
  }, [dish]);

  const toggleOption = (
    groupId: string,
    optionId: string,
    type: 'SINGLE' | 'MULTI'
  ) => {
    setSelected((prev) => {
      const next = { ...prev };
      const current = new Set(next[groupId] ?? []);
      if (type === 'SINGLE') {
        // Radio behavior: replace with the single choice (toggle off if same).
        if (current.has(optionId)) {
          next[groupId] = new Set();
        } else {
          next[groupId] = new Set([optionId]);
        }
      } else {
        if (current.has(optionId)) current.delete(optionId);
        else current.add(optionId);
        next[groupId] = current;
      }
      return next;
    });
  };

  // Missing required SINGLE groups block "add".
  const missingRequired = useMemo(() => {
    if (!dish) return [];
    return dish.addonGroups.filter(
      (g) =>
        g.type === 'SINGLE' &&
        g.required &&
        (selected[g.id]?.size ?? 0) === 0
    );
  }, [dish, selected]);

  const addonsTotal = useMemo(() => {
    if (!dish) return 0;
    let sum = 0;
    for (const g of dish.addonGroups) {
      const chosen = selected[g.id];
      if (!chosen) continue;
      for (const o of g.options) {
        if (chosen.has(o.id)) sum += o.priceDelta;
      }
    }
    return sum;
  }, [dish, selected]);

  const unit = dish?.price ?? 0;
  const linePrice = (unit + addonsTotal) * quantity;

  const handleAdd = () => {
    if (!dish || missingRequired.length > 0) return;
    const options: CartLine['options'] = [];
    for (const g of dish.addonGroups) {
      const chosen = selected[g.id];
      if (!chosen) continue;
      for (const o of g.options) {
        if (chosen.has(o.id)) {
          options.push({
            id: o.id,
            groupName: g.name,
            name: o.name,
            priceDelta: o.priceDelta
          });
        }
      }
    }
    onAdd({
      lineId: uuidv4(),
      dishId: dish.id,
      dishName: dish.name,
      unitPrice: unit,
      quantity,
      options,
      specialRequest: specialRequest.trim()
    });
    onOpenChange(false);
  };

  const fmt = (n: number) =>
    (Number.isInteger(n) ? n.toString() : n.toFixed(2)) + ' ' + currency;

  const positionClass = previewMode ? 'absolute' : 'fixed';

  return (
    <Dialog open={dish !== null} onOpenChange={onOpenChange}>
      {dish ? (
        <DialogPortal container={previewMode ? container ?? undefined : undefined}>
          <DialogOverlay className={cn(previewMode && 'absolute')} />
          <DialogPrimitive.Content
            className={cn(
              positionClass,
              'left-[50%] top-[50%] z-50 grid max-h-[90vh] w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto rounded-2xl border p-5 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out'
            )}
            style={{
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.text
            }}
          >
            <DialogPrimitive.Title className="pr-8 text-lg font-bold" style={accent}>
              {dish.name}
            </DialogPrimitive.Title>
            {dish.description ? (
              <DialogPrimitive.Description
                className="text-sm"
                style={{ color: theme.muted }}
              >
                {dish.description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">
                {dish.name}
              </DialogPrimitive.Description>
            )}

            {/* Add-on groups */}
            {dish.addonGroups.map((g) => {
              const chosen = selected[g.id] ?? new Set<string>();
              const isMissing = missingRequired.some((m) => m.id === g.id);
              return (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{g.name}</span>
                    {g.type === 'SINGLE' && g.required ? (
                      <span
                        className="text-[10px] font-medium uppercase"
                        style={{ color: isMissing ? '#ef4444' : theme.muted }}
                      >
                        {labels.required}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    {g.options.map((o) => {
                      const isChecked = chosen.has(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => toggleOption(g.id, o.id, g.type)}
                          className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors"
                          style={{
                            borderColor: isChecked ? theme.accent : theme.border,
                            backgroundColor: isChecked
                              ? theme.surface
                              : 'transparent'
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                'flex h-4 w-4 items-center justify-center border',
                                g.type === 'SINGLE'
                                  ? 'rounded-full'
                                  : 'rounded'
                              )}
                              style={{
                                borderColor: theme.accent,
                                backgroundColor: isChecked
                                  ? theme.accent
                                  : 'transparent'
                              }}
                            >
                              {isChecked ? (
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: theme.onAccent }}
                                />
                              ) : null}
                            </span>
                            {o.name}
                          </span>
                          {o.priceDelta ? (
                            <span style={{ color: theme.muted }}>
                              +{fmt(o.priceDelta)}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Special request */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">
                {labels.specialRequest}
              </label>
              <textarea
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder={labels.specialRequestPlaceholder}
                rows={2}
                maxLength={300}
                className="w-full resize-none rounded-lg border bg-transparent p-2 text-sm outline-none"
                style={{ borderColor: theme.border, color: theme.text }}
              />
            </div>

            {/* Quantity + add */}
            <div className="flex items-center justify-between gap-3">
              <div
                className="flex items-center gap-3 rounded-full border px-2 py-1"
                style={{ borderColor: theme.border }}
              >
                <button
                  type="button"
                  aria-label="-"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ color: theme.text }}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="+"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ color: theme.text }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={missingRequired.length > 0}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.onAccent
                }}
              >
                {labels.addToCart} · {fmt(linePrice)}
              </button>
            </div>

            <DialogPrimitive.Close
              aria-label={labels.close}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full opacity-90 transition-opacity hover:opacity-100"
              style={{
                backgroundColor: theme.surface,
                color: theme.text
              }}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      ) : null}
    </Dialog>
  );
}
