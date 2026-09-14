'use client';

import * as z from 'zod';
import { useEffect, useRef, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Globe,
  Instagram,
  ListChecks,
  Loader2,
  MapPin,
  Music2,
  Palette,
  Phone,
  Star,
  Type,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MenuAppearanceSchema, type MenuAppearance } from '@/schemas';
import { updateMenuAppearance } from '@/actions/update-menu-appearance';

import {
  MENU_FONT_OPTIONS,
  withAppearanceDefaults,
} from './appearance-defaults';

type FormValues = z.infer<typeof MenuAppearanceSchema>;

interface MenuAppearanceFormProps {
  /** The restaurant whose diner-menu appearance is being edited. */
  restaurantId: string;
  /**
   * Current saved appearance (from the owner-scoped read path). `null` when the
   * owner has not customized it yet — the form then starts from the defaults.
   */
  initialAppearance: MenuAppearance | null;
  /**
   * Seam for D.4's live phone-style preview: called on every field change with
   * the current (unsaved) values so a sibling preview panel can subscribe.
   * Optional so the form works standalone until the preview is wired in.
   */
  onAppearanceChange?: (values: Required<MenuAppearance>) => void;
}

/** A small lucide icon per info toggle, for scannability. */
const TOGGLE_ICON: Record<string, LucideIcon> = {
  showAddress: MapPin,
  showPhone: Phone,
  showWifi: Wifi,
  showWebsite: Globe,
  showInstagram: Instagram,
  showTiktok: Music2,
  showGoogle: Star,
};

/** The seven info-visibility toggles, in display order, with French copy. */
const INFO_TOGGLES: {
  name: keyof FormValues;
  label: string;
  description: string;
}[] = [
  {
    name: 'showAddress',
    label: 'Adresse',
    description: "Afficher l'adresse du restaurant sur le menu.",
  },
  {
    name: 'showPhone',
    label: 'Téléphone',
    description: 'Afficher le numéro de téléphone.',
  },
  {
    name: 'showWifi',
    label: 'Wifi',
    description: "Afficher le code / l'accès wifi.",
  },
  {
    name: 'showWebsite',
    label: 'Site web',
    description: 'Afficher le lien vers votre site web.',
  },
  {
    name: 'showInstagram',
    label: 'Instagram',
    description: 'Afficher le lien Instagram.',
  },
  {
    name: 'showTiktok',
    label: 'TikTok',
    description: 'Afficher le lien TikTok.',
  },
  {
    name: 'showGoogle',
    label: 'Google',
    description: 'Afficher le lien Google (avis / fiche).',
  },
];

export default function MenuAppearanceForm({
  restaurantId,
  initialAppearance,
  onAppearanceChange,
}: MenuAppearanceFormProps) {
  const [isPending, startTransition] = useTransition();

  // Hold the latest `onAppearanceChange` in a ref so the D.4 seam effect can
  // call the current callback without listing it as a dependency. This keeps
  // the subscription set up once per restaurant and breaks the render loop even
  // if a caller passes a new callback identity each render.
  const onAppearanceChangeRef = useRef(onAppearanceChange);
  useEffect(() => {
    onAppearanceChangeRef.current = onAppearanceChange;
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(MenuAppearanceSchema),
    // Start from a fully-populated state (stored values merged over defaults) so
    // unset appearance falls back to the default look (Requirement 4.4).
    defaultValues: withAppearanceDefaults(initialAppearance),
  });

  // Re-populate when the selected restaurant (and thus its saved appearance)
  // changes, so switching restaurants loads that restaurant's current values.
  // The form is remounted via `key={selected.id}` in the parent when the
  // restaurant changes, so `initialAppearance` is fixed for a given mount.
  // Depend only on the stable `restaurantId` to avoid object-identity-driven
  // reset churn from a new `initialAppearance` reference each render.
  useEffect(() => {
    form.reset(withAppearanceDefaults(initialAppearance));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // D.4 seam: surface unsaved edits to an optional preview subscriber. Set up
  // once per restaurant: seed the preview on mount, then push every field
  // change through `form.watch`. The callback is read from a ref so this effect
  // never re-runs on callback identity — which is what caused the render loop.
  useEffect(() => {
    onAppearanceChangeRef.current?.(withAppearanceDefaults(form.getValues()));
    const subscription = form.watch((values) => {
      onAppearanceChangeRef.current?.(
        withAppearanceDefaults(values as MenuAppearance)
      );
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, restaurantId]);

  const onSubmit = (values: FormValues) => {
    startTransition(() => {
      updateMenuAppearance(restaurantId, values)
        .then((data) => {
          if (data?.error) {
            toast.error(data.error);
          }

          if (data?.success) {
            toast.success('Apparence du menu enregistrée.');
            // Keep the form's "clean" baseline aligned with what was saved.
            form.reset(values);
          }
        })
        .catch(() => toast.error("Oups ! Quelque chose s'est mal passé."));
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Typographie & couleurs */}
        <Card className="rounded-xl border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                <Palette className="h-5 w-5" />
              </span>
              Typographie et couleurs
            </CardTitle>
            <CardDescription>
              Personnalisez la police et les couleurs de votre menu numérique.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <FormField
              control={form.control}
              name="fontFamily"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Police d&apos;écriture
                  </FormLabel>
                  <Select
                    disabled={isPending}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisissez une police" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MENU_FONT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur principale</FormLabel>
                    <FormControl>
                      <ColorField
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Utilisée pour les titres et les accents.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="backgroundColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur de fond</FormLabel>
                    <FormControl>
                      <ColorField
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Arrière-plan de la page du menu.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informations affichées */}
        <Card className="rounded-xl border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                <ListChecks className="h-5 w-5" />
              </span>
              Informations affichées
            </CardTitle>
            <CardDescription>
              Choisissez les informations visibles sur le menu du client.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Compact list: one framed block, hairline-divided rows with a
                small icon per row (no wall of identical boxes). */}
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {INFO_TOGGLES.map((toggle) => {
                const Icon = TOGGLE_ICON[toggle.name];
                return (
                  <FormField
                    key={toggle.name}
                    control={form.control}
                    name={toggle.name}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <FormLabel className="cursor-pointer">
                              {toggle.label}
                            </FormLabel>
                            <FormDescription className="text-xs">
                              {toggle.description}
                            </FormDescription>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            disabled={isPending}
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button disabled={isPending} type="submit" className="bg-yellow-400 text-black hover:bg-yellow-400/90">
            {isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/**
 * A color picker bound to a hex value: a native color input and a text input
 * kept in sync. The text input lets the owner paste an exact hex; the color
 * input gives a visual picker. Both write the same `#RRGGBB` string that the
 * `HexColor` schema validates.
 */
function ColorField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  // The native color input only accepts #RRGGBB; fall back to black when the
  // current text value isn't a full 6-digit hex yet (e.g. mid-typing).
  const swatchValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';

  return (
    <div className="flex items-center gap-2 rounded-lg border border-input bg-background p-1.5 focus-within:border-yellow-400/60">
      {/* The swatch IS the picker: click it to open the native color chooser. */}
      <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border">
        <span
          aria-hidden
          className="block h-full w-full"
          style={{ backgroundColor: swatchValue }}
        />
        <input
          type="color"
          aria-label="Sélecteur de couleur"
          disabled={disabled}
          value={swatchValue}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </label>
      <input
        value={value}
        disabled={disabled}
        placeholder="#FFFFFF"
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent font-mono text-sm uppercase outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
