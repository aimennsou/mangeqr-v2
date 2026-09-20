'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
// `qrcode` ships no bundled types.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QRCode from 'qrcode';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  LayoutGrid,
  Loader2,
  PartyPopper,
  Plus,
  QrCode as QrCodeIcon,
  Store,
  Trash2,
  UtensilsCrossed
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { downloadDataUrl } from '@/lib/download';
import { QrDesignPreview } from '@/components/design/QrDesignPreview';
import { getDesignPrice } from '@/config';
import { createLeadMenu, submitLeadOrder } from '@/actions/lead';
import type { FunnelDict } from './dict';

interface Dish {
  name: string;
  price: string;
  description: string;
}
interface Category {
  name: string;
  dishes: Dish[];
}

const emptyDish = (): Dish => ({ name: '', price: '', description: '' });
const emptyCategory = (): Category => ({ name: '', dishes: [emptyDish()] });

function ensureHttp(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function FunnelWizard({
  dict,
  appUrl
}: {
  dict: FunnelDict;
  appUrl: string;
}) {
  const rtl = dict.dir === 'rtl';
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();

  // Step 1 state
  const [restaurantName, setRestaurantName] = useState('');
  const [currency, setCurrency] = useState<'EURO' | 'DOLLAR' | 'DINAR'>(
    dict.locale === 'ar' ? 'DINAR' : 'EURO'
  );
  const [categories, setCategories] = useState<Category[]>([emptyCategory()]);
  const [error, setError] = useState('');

  // Result
  const [leadId, setLeadId] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Step 3 state
  const [designId, setDesignId] = useState(dict.designs[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [orderError, setOrderError] = useState('');

  const shareUrl = useMemo(
    () => (leadId ? `${appUrl.replace(/\/$/, '')}/m/${leadId}` : ''),
    [leadId, appUrl]
  );

  useEffect(() => {
    if (step !== 1 || !shareUrl) return;
    QRCode.toDataURL(ensureHttp(shareUrl), { width: 320, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [step, shareUrl]);

  const STEPS = [
    { label: dict.stepMenu, icon: Store },
    { label: dict.stepShare, icon: QrCodeIcon },
    { label: dict.stepDesign, icon: LayoutGrid },
    { label: dict.stepDone, icon: Check }
  ];

  // ---- Step 1 helpers ----
  const setCat = (ci: number, patch: Partial<Category>) =>
    setCategories((prev) => prev.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
  const setDish = (ci: number, di: number, patch: Partial<Dish>) =>
    setCategories((prev) =>
      prev.map((c, i) =>
        i === ci
          ? { ...c, dishes: c.dishes.map((d, j) => (j === di ? { ...d, ...patch } : d)) }
          : c
      )
    );
  const addDish = (ci: number) =>
    setCategories((prev) =>
      prev.map((c, i) => (i === ci ? { ...c, dishes: [...c.dishes, emptyDish()] } : c))
    );
  const removeDish = (ci: number, di: number) =>
    setCategories((prev) =>
      prev.map((c, i) =>
        i === ci ? { ...c, dishes: c.dishes.filter((_, j) => j !== di) } : c
      )
    );
  const addCategory = () => setCategories((prev) => [...prev, emptyCategory()]);
  const removeCategory = (ci: number) =>
    setCategories((prev) => prev.filter((_, i) => i !== ci));

  const submitMenu = () => {
    setError('');
    if (!restaurantName.trim()) {
      setError(dict.restaurantName);
      return;
    }
    // Keep only categories with a name and at least one named dish.
    const cleaned = categories
      .map((c) => ({
        name: c.name.trim(),
        dishes: c.dishes
          .filter((d) => d.name.trim())
          .map((d) => ({
            name: d.name.trim(),
            description: d.description.trim(),
            price: Number(d.price) || 0
          }))
      }))
      .filter((c) => c.name && c.dishes.length > 0);

    if (cleaned.length === 0) {
      setError(dict.atLeastOne);
      return;
    }

    startTransition(async () => {
      const res = await createLeadMenu({
        restaurantName: restaurantName.trim(),
        currency,
        locale: dict.locale,
        categories: cleaned
      });
      if (res.error || !res.id) {
        setError(res.error ?? 'Error');
        return;
      }
      setLeadId(res.id);
      setStep(1);
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    downloadDataUrl(qrDataUrl, `qr-${restaurantName || 'menu'}.png`);
  };

  const submitOrder = () => {
    setOrderError('');
    if (!contactName.trim() || !contactPhone.trim()) {
      setOrderError(!contactName.trim() ? dict.yourName : dict.yourPhone);
      return;
    }
    startTransition(async () => {
      const res = await submitLeadOrder({
        id: leadId,
        designId,
        quantity,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        notes: notes.trim()
      });
      if (res.error) {
        setOrderError(res.error);
        return;
      }
      setStep(3);
    });
  };

  const inputCls =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30';

  return (
    <div dir={dict.dir} className={cn('mx-auto max-w-2xl', rtl && 'text-right')}>
      {/* Hero */}
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-yellow-600">
          {dict.heroEyebrow}
        </p>
        <h1 className="font-serif-display mt-3 text-3xl font-light leading-tight tracking-tight text-neutral-900 sm:text-4xl">
          {dict.heroTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-600">
          {dict.heroSubtitle}
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center justify-center">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                    done && 'border-yellow-400 bg-yellow-400 text-black',
                    current && 'border-yellow-400 bg-yellow-400/15 text-yellow-700',
                    !done && !current && 'border-neutral-300 bg-neutral-100 text-neutral-400'
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className={cn('text-[11px]', current ? 'font-medium text-neutral-900' : 'text-neutral-500')}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 ? (
                <span className={cn('mx-2 mb-5 h-0.5 w-8 rounded-full sm:w-14', i < step ? 'bg-yellow-400' : 'bg-neutral-300')} />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
        {/* ---- Step 1: build menu ---- */}
        {step === 0 ? (
          <div className="space-y-5">
            <div>
              <h2 className="font-serif-display text-xl font-medium text-neutral-900">{dict.s1Title}</h2>
              <p className="mt-1 text-sm text-neutral-500">{dict.s1Subtitle}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-neutral-700">{dict.restaurantName}</label>
                <input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder={dict.restaurantNamePh} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">{dict.currency}</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value as typeof currency)} className={inputCls}>
                  <option value="EURO">€ Euro</option>
                  <option value="DOLLAR">$ Dollar</option>
                  <option value="DINAR">DZD Dinar</option>
                </select>
              </div>
            </div>

            {categories.map((cat, ci) => (
              <div key={ci} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center gap-2">
                  <input
                    value={cat.name}
                    onChange={(e) => setCat(ci, { name: e.target.value })}
                    placeholder={dict.categoryNamePh}
                    className={cn(inputCls, 'font-medium')}
                  />
                  {categories.length > 1 ? (
                    <button type="button" onClick={() => removeCategory(ci)} aria-label={dict.removeLabel} className="shrink-0 rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 space-y-3">
                  {cat.dishes.map((d, di) => (
                    <div key={di} className="grid gap-2 rounded-lg bg-neutral-50 p-3 sm:grid-cols-[1fr_auto]">
                      <div className="grid gap-2 sm:grid-cols-[1fr_90px]">
                        <input value={d.name} onChange={(e) => setDish(ci, di, { name: e.target.value })} placeholder={dict.dishNamePh} className={inputCls} />
                        <input value={d.price} onChange={(e) => setDish(ci, di, { price: e.target.value })} placeholder={dict.dishPrice} type="number" min={0} className={inputCls} />
                        <input value={d.description} onChange={(e) => setDish(ci, di, { description: e.target.value })} placeholder={dict.dishDescPh} className={cn(inputCls, 'sm:col-span-2')} />
                      </div>
                      {cat.dishes.length > 1 ? (
                        <button type="button" onClick={() => removeDish(ci, di)} aria-label={dict.removeLabel} className="self-start rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <button type="button" onClick={() => addDish(ci)} className="inline-flex items-center gap-1.5 text-sm font-medium text-yellow-700 hover:text-yellow-800">
                    <Plus className="h-4 w-4" /> {dict.addDish}
                  </button>
                </div>
              </div>
            ))}

            <button type="button" onClick={addCategory} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:border-yellow-400 hover:text-neutral-900">
              <Plus className="h-4 w-4" /> {dict.addCategory}
            </button>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <button type="button" onClick={submitMenu} disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-black transition hover:bg-yellow-400/90 disabled:opacity-60">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending ? dict.creating : dict.createMenu}
              {!pending ? <ArrowRight className={cn('h-4 w-4', rtl && 'rotate-180')} /> : null}
            </button>
          </div>
        ) : null}

        {/* ---- Step 2: QR + share ---- */}
        {step === 1 ? (
          <div className="space-y-6 text-center">
            <div>
              <h2 className="font-serif-display text-xl font-medium text-neutral-900">{dict.s2Title}</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">{dict.s2Subtitle}</p>
            </div>

            <div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR" className="h-44 w-44" />
              ) : (
                <div className="flex h-44 w-44 items-center justify-center text-sm text-neutral-400">…</div>
              )}
              <div className="flex w-full items-center gap-2" dir="ltr">
                <input readOnly value={shareUrl} className="flex-1 truncate rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-700" />
                <button type="button" onClick={copyLink} className="shrink-0 rounded-lg bg-yellow-400 p-2 text-black hover:bg-yellow-400/90" aria-label={dict.copyLink}>
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied ? <p className="text-xs font-medium text-green-600">{dict.copied}</p> : null}
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <button type="button" onClick={downloadQr} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400/90">
                  <Download className="h-4 w-4" /> {dict.downloadQr}
                </button>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                  <ExternalLink className="h-4 w-4" /> {dict.openMenu}
                </a>
              </div>
            </div>

            <button type="button" onClick={() => setStep(2)} className="mx-auto flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-neutral-800">
              {dict.continueDesign}
              <ArrowRight className={cn('h-4 w-4', rtl && 'rotate-180')} />
            </button>
          </div>
        ) : null}

        {/* ---- Step 3: order design ---- */}
        {step === 2 ? (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif-display text-xl font-medium text-neutral-900">{dict.s3Title}</h2>
              <p className="mt-1 text-sm text-neutral-500">{dict.s3Subtitle}</p>
            </div>

            {/* Design gallery */}
            <div className="grid grid-cols-3 gap-3">
              {dict.designs.map((d) => {
                const active = d.id === designId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDesignId(d.id)}
                    className={cn(
                      'relative flex flex-col overflow-hidden rounded-xl border p-3 text-center transition',
                      active ? 'border-yellow-400 ring-2 ring-yellow-400/40' : 'border-neutral-200 hover:border-yellow-400/60'
                    )}
                  >
                    {active ? (
                      <span className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-black">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : null}
                    <div className="mb-2 flex items-center justify-center px-1">
                      <div className="w-full max-w-[92px]">
                        <QrDesignPreview shape={d.shape} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-neutral-900">{d.name}</span>
                    <span className="mt-0.5 text-[11px] text-yellow-700">{getDesignPrice(d.id, currency)}</span>
                  </button>
                );
              })}
            </div>

            {/* Contact form */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-neutral-700">{dict.yourName}</label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={dict.yourNamePh} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">{dict.yourPhone}</label>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder={dict.yourPhonePh} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">{dict.quantity}</label>
                <input type="number" min={1} max={1000} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))} className={inputCls} dir="ltr" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-neutral-700">{dict.yourEmail}</label>
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder={dict.yourEmailPh} className={inputCls} dir="ltr" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-neutral-700">{dict.notes}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={dict.notesPh} rows={2} className={cn(inputCls, 'resize-none')} />
              </div>
            </div>

            {orderError ? <p className="text-sm text-red-500">{orderError}</p> : null}

            <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setStep(3)} className="text-sm font-medium text-neutral-500 hover:text-neutral-800">
                {dict.skipForNow}
              </button>
              <button type="button" onClick={submitOrder} disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-black transition hover:bg-yellow-400/90 disabled:opacity-60 sm:w-auto">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {pending ? dict.submitting : dict.submitOrder}
              </button>
            </div>
          </div>
        ) : null}

        {/* ---- Step 4: done ---- */}
        {step === 3 ? (
          <div className="space-y-4 py-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400/15 text-yellow-600">
              <PartyPopper className="h-7 w-7" />
            </span>
            <h2 className="font-serif-display text-2xl font-medium text-neutral-900">{dict.s4Title}</h2>
            <p className="mx-auto max-w-md text-sm text-neutral-600">{dict.s4Subtitle}</p>
            <div className="mx-auto max-w-md rounded-xl border border-dashed border-yellow-400/60 bg-yellow-400/5 p-4 text-sm text-neutral-700">
              {dict.s4Note}
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                <UtensilsCrossed className="h-4 w-4" /> {dict.openMenu}
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
