'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
// `qrcode` ships no bundled types.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  PartyPopper,
  Store,
  UtensilsCrossed,
  LayoutGrid,
  QrCode as QrCodeIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import RestoDrawerDialogDemo from '@/app/(protected)/_components/restaurants/CreateRestaurant';
import MenuDrawerDialogDemo from '@/app/(protected)/_components/menus/CreateMenu';
import CreateCategorie from '@/app/(protected)/_components/categories/CreateCategorie';
import CreatePlat from '@/app/(protected)/_components/plats/CreatePlat';
import { completeOnboarding } from '@/actions/onboarding';
import { TOUR_START_EVENT } from '@/app/(protected)/_admin-panel/welcome-tour';

interface OnboardingWizardProps {
  userName: string | null;
  rootDomain: string;
}

type Restaurant = {
  id: string;
  name: string;
  subdomain?: string | null;
  qrUrl?: string | null;
  currency?: string | null;
};
type Menu = { id: string; name: string };
type Category = { id: string; name: string };

const STEPS = [
  { key: 'restaurant', label: 'Restaurant', icon: Store },
  { key: 'menu', label: 'Menu', icon: LayoutGrid },
  { key: 'dishes', label: 'Plats', icon: UtensilsCrossed },
  { key: 'qr', label: 'QR code', icon: QrCodeIcon }
] as const;

function ensureHttp(url: string) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function OnboardingWizard({ userName, rootDomain }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isFinishing, startFinish] = useTransition();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishCount, setDishCount] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Human-friendly share link: subdomain URL in prod, path URL locally.
  const shareUrl = useMemo(() => {
    if (!restaurant) return '';
    const isLocal = /localhost|127\.0\.0\.1/.test(rootDomain);
    if (!isLocal && restaurant.subdomain) {
      return `https://${restaurant.subdomain}.${rootDomain}`;
    }
    return ensureHttp(restaurant.qrUrl ?? '');
  }, [restaurant, rootDomain]);

  // The QR always encodes the stable id-based path (restaurant.qrUrl).
  useEffect(() => {
    const target = restaurant?.qrUrl;
    if (step !== 3 || !target) return;
    QRCode.toDataURL(ensureHttp(target), { width: 320, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [step, restaurant?.qrUrl]);

  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));

  // ---- Step handlers ----
  const onRestaurantCreated = (r: any) => {
    setRestaurant({
      id: r.id,
      name: r.name,
      subdomain: r.subdomain,
      qrUrl: r.qrUrl,
      currency: r.currency
    });
    goNext();
  };

  const onMenuCreated = (m: any) => {
    setMenu({ id: m.id, name: m.name });
    goNext();
  };

  const onCategoryCreated = (c: any) => {
    setCategories((prev) => [...prev, { id: c.id, name: c.name }]);
  };

  const finish = () => {
    startFinish(async () => {
      await completeOnboarding();
      // Hand off to the welcome tour on the next page, then navigate.
      try {
        window.localStorage.removeItem('mangeqr_tour_dismissed');
      } catch {
        /* ignore */
      }
      router.push('/performances');
      // Fire after navigation so the tour listener (mounted in the app shell)
      // catches it.
      setTimeout(() => {
        try {
          window.dispatchEvent(new Event(TOUR_START_EVENT));
        } catch {
          /* ignore */
        }
      }, 800);
    });
  };

  const copyLink = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => toast.success('Lien copié !'))
      .catch(() => toast.error('Impossible de copier le lien.'));
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${restaurant?.name ?? 'menu'}.png`;
    a.click();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo />
        <h1 className="font-serif-display mt-6 text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          {step === 0 && userName
            ? `Bienvenue, ${userName} 👋`
            : 'Configurons votre carte'}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Quelques étapes pour publier votre premier menu. C&apos;est parti.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center justify-center">
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                    done && 'border-yellow-400 bg-yellow-400 text-black',
                    current &&
                      'border-yellow-400 bg-yellow-400/15 text-yellow-600 dark:text-yellow-500',
                    !done && !current && 'border-border bg-muted text-muted-foreground'
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span
                  className={cn(
                    'text-[11px]',
                    current ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 ? (
                <span
                  className={cn(
                    'mx-2 mb-5 h-0.5 w-8 rounded-full sm:w-16',
                    i < step ? 'bg-yellow-400' : 'bg-border'
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Step card */}
      <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm">
        {/* Step 1: restaurant */}
        {step === 0 ? (
          <div>
            <div className="border-b border-border px-6 py-5">
              <h2 className="font-serif-display text-2xl font-medium tracking-tight">
                Créez votre restaurant
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Nom, adresse, devise et lien d&apos;accès à votre menu.
              </p>
            </div>
            <RestoDrawerDialogDemo onAddRestaurant={onRestaurantCreated} />
          </div>
        ) : null}

        {/* Step 2: menu */}
        {step === 1 && restaurant ? (
          <div>
            <div className="border-b border-border px-6 py-5">
              <h2 className="font-serif-display text-2xl font-medium tracking-tight">
                Créez un menu
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pour {restaurant.name}. Ex : « Menu du Midi », « Carte du soir ».
              </p>
            </div>
            <MenuDrawerDialogDemo
              onAddMenu={onMenuCreated}
              defaultRestaurantId={restaurant.id}
            />
          </div>
        ) : null}

        {/* Step 3: categories + dishes */}
        {step === 2 && menu ? (
          <div className="px-6 py-6">
            <div className="mb-4">
              <h2 className="font-serif-display text-2xl font-medium tracking-tight">
                Ajoutez catégories &amp; plats
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Créez au moins une catégorie (ex : Entrées), puis ajoutez-y un
                plat.
              </p>
            </div>

            {/* Create a category */}
            <div className="rounded-xl border border-border">
              <div className="border-b border-border px-4 py-3 text-sm font-semibold">
                1. Nouvelle catégorie
              </div>
              <CreateCategorie menuId={menu.id} onAddCategory={onCategoryCreated} />
            </div>

            {/* Created categories + add a dish */}
            {categories.length > 0 ? (
              <div className="mt-4 rounded-xl border border-border">
                <div className="border-b border-border px-4 py-3 text-sm font-semibold">
                  2. Ajouter un plat
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {categories.length} catégorie{categories.length > 1 ? 's' : ''} ·{' '}
                    {dishCount} plat{dishCount > 1 ? 's' : ''}
                  </span>
                </div>
                <CreatePlat
                  categories={categories}
                  currency={restaurant?.currency}
                  onAddDish={() => setDishCount((n) => n + 1)}
                />
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={goNext}
                className="text-muted-foreground"
              >
                Passer
              </Button>
              <Button
                onClick={goNext}
                disabled={categories.length === 0}
                className="bg-yellow-400 text-black hover:bg-yellow-400/90"
              >
                Continuer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* Step 4: QR + share */}
        {step === 3 && restaurant ? (
          <div className="px-6 py-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
              <PartyPopper className="h-6 w-6" />
            </span>
            <h2 className="font-serif-display mt-4 text-2xl font-medium tracking-tight">
              Votre menu est en ligne !
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Partagez ce QR code ou ce lien avec vos clients pour qu&apos;ils
              découvrent votre carte.
            </p>

            <div className="mx-auto mt-6 flex max-w-sm flex-col items-center gap-4 rounded-xl border border-border bg-background p-6">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code" className="h-48 w-48" />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center text-sm text-muted-foreground">
                  Génération du QR…
                </div>
              )}

              <div className="flex w-full items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 truncate rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-foreground"
                />
                <Button
                  size="icon"
                  onClick={copyLink}
                  className="shrink-0 bg-yellow-400 text-black hover:bg-yellow-400/90"
                  aria-label="Copier le lien"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button onClick={downloadQr} className="flex-1 bg-yellow-400 text-black hover:bg-yellow-400/90">
                  <Download className="mr-2 h-4 w-4" /> Télécharger
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Aperçu
                  </a>
                </Button>
              </div>
            </div>

            <Button
              onClick={finish}
              disabled={isFinishing}
              size="lg"
              className="mt-8 bg-yellow-400 text-black hover:bg-yellow-400/90"
            >
              {isFinishing ? 'Chargement…' : 'Accéder à mon espace'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
