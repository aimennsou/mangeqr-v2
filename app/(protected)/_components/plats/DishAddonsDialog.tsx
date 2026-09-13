'use client';

import { useEffect, useState, useTransition } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { saveDishAddons } from '@/actions/addons';

interface OptionItem {
  id: string;
  name: string;
  priceDelta: number;
}
interface GroupItem {
  id: string;
  name: string;
  type: 'SINGLE' | 'MULTI';
  required: boolean;
  options: OptionItem[];
}

interface DishAddonsDialogProps {
  dishId: string;
  dishName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Currency symbol for price-delta hints (display only). */
  currencySymbol?: string;
}

/**
 * FEAT-1/D12 — Owner editor for a dish's add-on groups. Supports SINGLE (choose
 * one, optionally required) and MULTI (choose several) groups, each with priced
 * options. The whole set is saved via the `saveDishAddons` server action.
 */
export function DishAddonsDialog({
  dishId,
  dishName,
  open,
  onOpenChange,
  currencySymbol = '€'
}: DishAddonsDialogProps) {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, startSaving] = useTransition();

  // Load existing add-ons when the dialog opens.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    fetch(`/api/plat/addons?dishId=${encodeURIComponent(dishId)}`)
      .then((res) => (res.ok ? res.json() : { groups: [] }))
      .then((data) => {
        if (!active) return;
        const loaded: GroupItem[] = (data.groups ?? []).map((g: any) => ({
          id: g.id,
          name: g.name,
          type: g.type,
          required: g.required,
          options: (g.options ?? []).map((o: any) => ({
            id: o.id,
            name: o.name,
            priceDelta: o.priceDelta
          }))
        }));
        setGroups(loaded);
      })
      .catch(() => setGroups([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, dishId]);

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      {
        id: uuidv4(),
        name: '',
        type: 'SINGLE',
        required: false,
        options: [{ id: uuidv4(), name: '', priceDelta: 0 }]
      }
    ]);
  };

  const updateGroup = (id: string, patch: Partial<GroupItem>) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const removeGroup = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const addOption = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: [
                ...g.options,
                { id: uuidv4(), name: '', priceDelta: 0 }
              ]
            }
          : g
      )
    );
  };

  const updateOption = (
    groupId: string,
    optionId: string,
    patch: Partial<OptionItem>
  ) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: g.options.map((o) =>
                o.id === optionId ? { ...o, ...patch } : o
              )
            }
          : g
      )
    );
  };

  const removeOption = (groupId: string, optionId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, options: g.options.filter((o) => o.id !== optionId) }
          : g
      )
    );
  };

  const save = () => {
    // Client-side validation mirrors the server schema for friendlier errors.
    for (const g of groups) {
      if (!g.name.trim()) {
        toast.error('Chaque groupe doit avoir un nom.');
        return;
      }
      if (g.options.length === 0) {
        toast.error(`Le groupe « ${g.name} » doit avoir au moins une option.`);
        return;
      }
      if (g.options.some((o) => !o.name.trim())) {
        toast.error(`Chaque option du groupe « ${g.name} » doit avoir un nom.`);
        return;
      }
    }

    startSaving(async () => {
      const result = await saveDishAddons({
        dishId,
        groups: groups.map((g, gi) => ({
          id: g.id,
          name: g.name.trim(),
          type: g.type,
          required: g.type === 'SINGLE' ? g.required : false,
          position: gi,
          options: g.options.map((o, oi) => ({
            id: o.id,
            name: o.name.trim(),
            priceDelta: Number(o.priceDelta) || 0,
            position: oi
          }))
        }))
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.success ?? 'Suppléments enregistrés.');
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Suppléments — {dishName}</DialogTitle>
          <DialogDescription>
            Définissez des groupes de suppléments : « choix unique » (ex. Taille
            S/M/L) ou « choix multiple » (ex. Extras). Chaque option peut ajouter
            un prix.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement...
          </div>
        ) : (
          <div className="space-y-4">
            {groups.length === 0 ? (
              <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                Aucun supplément. Ajoutez un groupe pour commencer.
              </p>
            ) : (
              groups.map((g) => (
                <div key={g.id} className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-start gap-2">
                    <div className="grid flex-1 gap-2">
                      <Label>Nom du groupe</Label>
                      <Input
                        value={g.name}
                        onChange={(e) =>
                          updateGroup(g.id, { name: e.target.value })
                        }
                        placeholder="ex. Taille, Extras…"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label="Supprimer le groupe"
                      onClick={() => removeGroup(g.id)}
                      className="mt-7 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="grid gap-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={g.type}
                        onValueChange={(v) =>
                          updateGroup(g.id, {
                            type: v as 'SINGLE' | 'MULTI',
                            // MULTI can't be required.
                            required: v === 'MULTI' ? false : g.required
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE">Choix unique</SelectItem>
                          <SelectItem value="MULTI">Choix multiple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {g.type === 'SINGLE' ? (
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={g.required}
                          onCheckedChange={(c) =>
                            updateGroup(g.id, { required: c })
                          }
                        />
                        Obligatoire
                      </label>
                    ) : null}
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <Label className="text-xs">Options</Label>
                    {g.options.map((o) => (
                      <div key={o.id} className="flex items-center gap-2">
                        <Input
                          value={o.name}
                          onChange={(e) =>
                            updateOption(g.id, o.id, { name: e.target.value })
                          }
                          placeholder="Nom de l'option"
                          className="flex-1"
                        />
                        <div className="relative w-28">
                          <Input
                            type="number"
                            step="0.01"
                            value={o.priceDelta}
                            onChange={(e) =>
                              updateOption(g.id, o.id, {
                                priceDelta: parseFloat(e.target.value) || 0
                              })
                            }
                            className="pr-7"
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {currencySymbol}
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label="Supprimer l'option"
                          onClick={() => removeOption(g.id, o.id)}
                          className="text-muted-foreground hover:text-red-500"
                          disabled={g.options.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(g.id)}
                    >
                      <Plus className="mr-1 h-4 w-4" /> Ajouter une option
                    </Button>
                  </div>
                </div>
              ))
            )}

            <Button type="button" variant="outline" onClick={addGroup}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter un groupe
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            className="bg-yellow-400 text-black hover:bg-yellow-400"
            onClick={save}
            disabled={isSaving || loading}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
