'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import type { Restaurant } from '@/types';
import {
  resolvePrinterConfig,
  type PrinterConfig
} from '@/schemas';
import { updatePrinterConfig } from '@/actions/update-printer-config';
import { printOrderTicket } from '../../_components/orders/print-ticket';
import type { OrderView } from '@/data/orders';

/** A fake but complete order used only by the "Test print" button. */
function sampleOrder(restaurant: Restaurant | undefined): OrderView {
  return {
    id: 'test',
    orderNumber: 0,
    restaurantId: restaurant?.id ?? 'test',
    restaurantName: restaurant?.name ?? 'Restaurant',
    restaurantAddress: restaurant?.address ?? null,
    restaurantPhone: restaurant?.phone ?? null,
    type: 'DINE_IN' as OrderView['type'],
    status: 'RECEIVED' as OrderView['status'],
    tableLabel: '12',
    customerName: null,
    customerPhone: null,
    address: null,
    latitude: null,
    longitude: null,
    note: null,
    total: 27.5,
    currency: restaurant?.currency === 'DINAR' ? 'DA' : '€',
    paid: false,
    paidAt: null,
    createdAt: new Date(),
    items: [
      {
        id: 'i1',
        dishName: 'Burger Maison',
        quantity: 2,
        lineTotal: 19,
        addons: [{ groupName: 'Cuisson', optionName: 'À point', priceDelta: 0 }],
        specialRequest: 'Sans oignon'
      },
      {
        id: 'i2',
        dishName: 'Coca-Cola',
        quantity: 1,
        lineTotal: 3.5,
        addons: [],
        specialRequest: null
      },
      {
        id: 'i3',
        dishName: 'Frites',
        quantity: 1,
        lineTotal: 5,
        addons: [],
        specialRequest: null
      }
    ]
  };
}

/**
 * Owner-facing "Imprimante des tickets" section of the account/settings page.
 *
 * Because the app prints from the browser (a self-printing popup), this does
 * not talk to a driver — it lets the owner configure the RECEIPT LAYOUT and
 * print BEHAVIOR per restaurant (paper width, copies, auto-print, header/footer
 * text, logo/prices toggles) and persists it to `Restaurant.printerConfig` via
 * `updatePrinterConfig`. A "Test print" button renders a sample ticket with the
 * unsaved draft so the owner can dial it in before saving.
 */
export default function PrinterSettingsCard() {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<PrinterConfig>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/magasin');
        const data = res.ok ? await res.json() : [];
        const list: Restaurant[] = Array.isArray(data) ? data : [];
        setRestaurants(list);
        if (list.length > 0) setSelectedId(list[0].id);
      } catch {
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = useMemo(
    () => restaurants.find((r) => r.id === selectedId),
    [restaurants, selectedId]
  );

  // Seed the draft from the selected restaurant's saved config (merged onto
  // defaults) whenever the selection changes.
  useEffect(() => {
    setDraft(resolvePrinterConfig(selected?.printerConfig ?? null));
  }, [selected]);

  const cfg = resolvePrinterConfig(draft);

  const patch = (p: Partial<PrinterConfig>) =>
    setDraft((prev) => ({ ...prev, ...p }));

  const save = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await updatePrinterConfig(selected.id, draft);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t('printer.saved'));
      // Reflect the saved config back onto the local list so re-selecting the
      // restaurant keeps the values.
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === selected.id ? { ...r, printerConfig: draft } : r
        )
      );
    });
  };

  const testPrint = () => {
    printOrderTicket(sampleOrder(selected), draft);
  };

  return (
    <Card className="rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Printer className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg md:text-xl font-semibold">
            {t('printer.title')}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('printer.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : restaurants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('printer.noRestaurant')}
          </p>
        ) : (
          <>
            {/* Restaurant selector (only shown when there is more than one) */}
            {restaurants.length > 1 ? (
              <div className="space-y-1.5">
                <Label>{t('common.restaurant')}</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.chooseRestaurant')} />
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
            ) : null}

            {/* Paper width + copies */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('printer.paperWidth')}</Label>
                <Select
                  value={String(cfg.paperWidth)}
                  onValueChange={(v) =>
                    patch({ paperWidth: v === '58' ? 58 : 80 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">
                      58&nbsp;mm ({t('printer.paperNarrow')})
                    </SelectItem>
                    <SelectItem value="80">
                      80&nbsp;mm ({t('printer.paperStandard')})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('printer.copies')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={cfg.copies}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    patch({
                      copies: Number.isFinite(n)
                        ? Math.min(Math.max(Math.round(n), 1), 5)
                        : 1
                    });
                  }}
                />
              </div>
            </div>

            {/* Printer name (informational) */}
            <div className="space-y-1.5">
              <Label>{t('printer.printerName')}</Label>
              <Input
                value={cfg.printerName ?? ''}
                placeholder={t('printer.printerNamePlaceholder')}
                onChange={(e) => patch({ printerName: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {t('printer.printerNameHelp')}
              </p>
            </div>

            {/* Header + footer text */}
            <div className="space-y-1.5">
              <Label>{t('printer.headerText')}</Label>
              <Input
                value={cfg.headerText ?? ''}
                placeholder={t('printer.headerPlaceholder')}
                onChange={(e) => patch({ headerText: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('printer.footerText')}</Label>
              <Textarea
                rows={2}
                value={cfg.footerText ?? ''}
                placeholder={t('printer.footerPlaceholder')}
                onChange={(e) => patch({ footerText: e.target.value })}
              />
            </div>

            {/* Toggles */}
            <div className="space-y-3 rounded-md border p-3">
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm">
                  <span className="font-medium">{t('printer.autoPrint')}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t('printer.autoPrintHelp')}
                  </span>
                </span>
                <Switch
                  checked={!!cfg.autoPrint}
                  onCheckedChange={(v) => patch({ autoPrint: v })}
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">
                  {t('printer.showLogo')}
                </span>
                <Switch
                  checked={!!cfg.showLogo}
                  onCheckedChange={(v) => patch({ showLogo: v })}
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="text-sm">
                  <span className="font-medium">{t('printer.showPrices')}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t('printer.showPricesHelp')}
                  </span>
                </span>
                <Switch
                  checked={!!cfg.showPrices}
                  onCheckedChange={(v) => patch({ showPrices: v })}
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={isPending}>
                {isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button variant="outline" onClick={testPrint} type="button">
                <Printer className="mr-1 h-4 w-4" />
                {t('printer.testPrint')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
