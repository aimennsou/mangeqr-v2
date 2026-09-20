'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Monitor, MonitorSmartphone } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  resolveTvConfig,
  resolveBorneConfig,
  type TvConfig,
  type BorneConfig,
} from '@/schemas';
import { updateTvConfig, updateBorneConfig } from '@/actions/update-display-config';

interface RestaurantLite {
  id: string;
  name: string;
  tvConfig?: TvConfig | null;
  borneConfig?: BorneConfig | null;
}

/**
 * "Affichages" — owner-side editor for the two public display views:
 *  - TV menu board (/tv/[id])
 *  - Self-order kiosk / borne (/borne/[id])
 * Lets the owner pick a restaurant, customize each display, save, and open a
 * live preview in a new tab.
 */
export default function DisplaysSection() {
  const [restaurants, setRestaurants] = useState<RestaurantLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/magasin');
        const data = res.ok ? await res.json() : [];
        const list: RestaurantLite[] = Array.isArray(data) ? data : [];
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

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">Chargement…</div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Créez un restaurant pour configurer vos affichages.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h3 className="font-serif-display text-2xl font-light tracking-tight text-foreground">
          Affichages en salle
        </h3>
        <p className="text-sm text-muted-foreground">
          Configurez l&apos;écran TV qui présente votre menu et la borne de
          commande en libre-service.
        </p>
      </div>

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

      {selected ? (
        <>
          <TvEditor key={`tv-${selected.id}`} restaurant={selected} />
          <BorneEditor key={`borne-${selected.id}`} restaurant={selected} />
        </>
      ) : null}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-foreground">{label}</span>
      {children}
    </div>
  );
}

function TvEditor({ restaurant }: { restaurant: RestaurantLite }) {
  const initial = resolveTvConfig(restaurant.tvConfig ?? null);
  const [cfg, setCfg] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof typeof cfg>(k: K, v: (typeof cfg)[K]) =>
    setCfg((prev) => ({ ...prev, [k]: v }));

  const save = () => {
    startTransition(async () => {
      const res = await updateTvConfig(restaurant.id, cfg);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Enregistré.');
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
            <Monitor className="h-5 w-5" />
          </span>
          <h4 className="text-lg font-semibold">Écran TV</h4>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/tv/${restaurant.id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" /> Aperçu
          </a>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="tv-title" className="text-xs text-muted-foreground">
            Titre du tableau (défaut : nom du restaurant)
          </Label>
          <Input
            id="tv-title"
            value={cfg.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={restaurant.name}
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Thème</Label>
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {(['dark', 'light'] as const).map((th) => (
              <button
                key={th}
                type="button"
                onClick={() => set('theme', th)}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
                  cfg.theme === th
                    ? 'bg-yellow-400 text-black'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {th === 'dark' ? 'Sombre' : 'Clair'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Colonnes</Label>
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {([1, 2, 3] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('columns', c)}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                  cfg.columns === c
                    ? 'bg-yellow-400 text-black'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="tv-accent" className="text-xs text-muted-foreground">
            Couleur d&apos;accent
          </Label>
          <input
            id="tv-accent"
            type="color"
            value={cfg.accent}
            onChange={(e) => set('accent', e.target.value)}
            className="h-9 w-full cursor-pointer rounded-md border border-border bg-transparent"
          />
        </div>

        <div className="sm:col-span-2 space-y-1 border-t border-border pt-3">
          <Row label="Afficher les photos">
            <Switch
              checked={cfg.showPhotos}
              onCheckedChange={(v) => set('showPhotos', v)}
            />
          </Row>
          <Row label="Afficher les prix">
            <Switch
              checked={cfg.showPrices}
              onCheckedChange={(v) => set('showPrices', v)}
            />
          </Row>
          <Row label="Afficher les descriptions">
            <Switch
              checked={cfg.showDescriptions}
              onCheckedChange={(v) => set('showDescriptions', v)}
            />
          </Row>
          <Row label="Défilement automatique">
            <Switch
              checked={cfg.autoScroll}
              onCheckedChange={(v) => set('autoScroll', v)}
            />
          </Row>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={save}
          disabled={isPending}
          className="bg-yellow-400 text-black hover:bg-yellow-400/90"
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </section>
  );
}

function BorneEditor({ restaurant }: { restaurant: RestaurantLite }) {
  const initial = resolveBorneConfig(restaurant.borneConfig ?? null);
  const [cfg, setCfg] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof typeof cfg>(k: K, v: (typeof cfg)[K]) =>
    setCfg((prev) => ({ ...prev, [k]: v }));

  const save = () => {
    startTransition(async () => {
      const res = await updateBorneConfig(restaurant.id, cfg);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Enregistré.');
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
            <MonitorSmartphone className="h-5 w-5" />
          </span>
          <h4 className="text-lg font-semibold">Borne de commande</h4>
        </div>
        <Button asChild variant="outline" size="sm">
          <a
            href={`/borne/${restaurant.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Aperçu
          </a>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="borne-title" className="text-xs text-muted-foreground">
            Titre d&apos;accueil
          </Label>
          <Input
            id="borne-title"
            value={cfg.welcomeTitle}
            onChange={(e) => set('welcomeTitle', e.target.value)}
            placeholder="Bienvenue"
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label
            htmlFor="borne-subtitle"
            className="text-xs text-muted-foreground"
          >
            Sous-titre
          </Label>
          <Input
            id="borne-subtitle"
            value={cfg.welcomeSubtitle}
            onChange={(e) => set('welcomeSubtitle', e.target.value)}
            placeholder="Touchez pour commander"
          />
        </div>
        <div className="grid gap-1.5">
          <Label
            htmlFor="borne-accent"
            className="text-xs text-muted-foreground"
          >
            Couleur d&apos;accent
          </Label>
          <input
            id="borne-accent"
            type="color"
            value={cfg.accent}
            onChange={(e) => set('accent', e.target.value)}
            className="h-9 w-full cursor-pointer rounded-md border border-border bg-transparent"
          />
        </div>
        <div className="flex items-end">
          <Row label="Afficher les photos">
            <Switch
              checked={cfg.showPhotos}
              onCheckedChange={(v) => set('showPhotos', v)}
            />
          </Row>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        La borne active automatiquement la prise de commande, même si elle est
        désactivée pour le menu client.
      </p>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={save}
          disabled={isPending}
          className="bg-yellow-400 text-black hover:bg-yellow-400/90"
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </section>
  );
}
