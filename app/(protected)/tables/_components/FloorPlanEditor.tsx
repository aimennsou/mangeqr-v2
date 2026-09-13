'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { saveFloorPlan } from '@/actions/tables';

interface Zone {
  id: string;
  name: string;
  position: number;
}
interface TableItem {
  id: string;
  label: string;
  seats: number | null;
  zoneId: string | null;
  posX: number;
  posY: number;
}

const NO_ZONE = '__none__';
const TABLE_W = 72;
const TABLE_H = 72;

export function FloorPlanEditor() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, startSaving] = useTransition();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState('');

  const canvasRef = useRef<HTMLDivElement | null>(null);
  // Active pointer-drag state (which table + grab offset within it).
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);

  // ---- Load restaurants ----
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/magasin');
        const data = res.ok ? await res.json() : [];
        setRestaurants(Array.isArray(data) ? data : []);
      } catch {
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- Load floor plan when a restaurant is chosen ----
  const loadPlan = useCallback(async (restaurantId: string) => {
    if (!restaurantId) {
      setZones([]);
      setTables([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/tables?restaurantId=${encodeURIComponent(restaurantId)}`
      );
      const data = res.ok ? await res.json() : { zones: [], tables: [] };
      setZones(Array.isArray(data.zones) ? data.zones : []);
      setTables(Array.isArray(data.tables) ? data.tables : []);
    } catch {
      setZones([]);
      setTables([]);
    }
    setSelectedTableId(null);
  }, []);

  useEffect(() => {
    loadPlan(selectedRestaurantId);
  }, [selectedRestaurantId, loadPlan]);

  // ---- Drag handling (pointer events, absolute positioning) ----
  const onTablePointerDown = (e: React.PointerEvent, table: TableItem) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dragRef.current = {
      id: table.id,
      dx: e.clientX - rect.left - table.posX,
      dy: e.clientY - rect.top - table.posY
    };
    setSelectedTableId(table.id);
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left - drag.dx;
    let y = e.clientY - rect.top - drag.dy;
    // Clamp inside the canvas.
    x = Math.max(0, Math.min(x, rect.width - TABLE_W));
    y = Math.max(0, Math.min(y, rect.height - TABLE_H));
    setTables((prev) =>
      prev.map((t) => (t.id === drag.id ? { ...t, posX: x, posY: y } : t))
    );
  };

  const onCanvasPointerUp = () => {
    dragRef.current = null;
  };

  // ---- Mutations (local state; persisted on Save) ----
  const addTable = () => {
    // Suggest the next numeric label.
    const nums = tables
      .map((t) => Number(t.label))
      .filter((n) => !Number.isNaN(n));
    const nextLabel = String((nums.length ? Math.max(...nums) : 0) + 1);
    const id = uuidv4();
    setTables((prev) => [
      ...prev,
      {
        id,
        label: nextLabel,
        seats: 2,
        zoneId: null,
        // Stagger new tables so they don't stack exactly.
        posX: 20 + (prev.length % 6) * 90,
        posY: 20 + Math.floor(prev.length / 6) * 90
      }
    ]);
    setSelectedTableId(id);
  };

  const removeTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    if (selectedTableId === id) setSelectedTableId(null);
  };

  const updateTable = (id: string, patch: Partial<TableItem>) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const addZone = () => {
    const name = newZoneName.trim();
    if (!name) return;
    setZones((prev) => [
      ...prev,
      { id: uuidv4(), name, position: prev.length }
    ]);
    setNewZoneName('');
  };

  const removeZone = (id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    // Unassign tables from the removed zone.
    setTables((prev) =>
      prev.map((t) => (t.zoneId === id ? { ...t, zoneId: null } : t))
    );
  };

  const save = () => {
    if (!selectedRestaurantId) return;
    startSaving(async () => {
      const result = await saveFloorPlan({
        restaurantId: selectedRestaurantId,
        zones: zones.map((z, i) => ({ ...z, position: i })),
        tables: tables.map((t) => ({
          id: t.id,
          label: t.label,
          seats: t.seats,
          zoneId: t.zoneId,
          posX: t.posX,
          posY: t.posY
        }))
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.success ?? 'Plan enregistré.');
      loadPlan(selectedRestaurantId);
    });
  };

  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;
  const zoneName = (id: string | null) =>
    id ? zones.find((z) => z.id === id)?.name ?? '' : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Restaurant selector + save */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="grid w-full gap-2 md:max-w-xs">
          <Label>Restaurant</Label>
          <Select
            value={selectedRestaurantId}
            onValueChange={setSelectedRestaurantId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisissez un restaurant" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Mes restaurants</SelectLabel>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {selectedRestaurantId && (
          <div className="flex gap-2 md:ml-auto">
            <Button variant="outline" onClick={addTable}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter une table
            </Button>
            <Button
              className="bg-yellow-400 text-black hover:bg-yellow-400"
              onClick={save}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      {!selectedRestaurantId ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-semibold">Sélectionnez un restaurant.</p>
          <p className="mt-2">
            Choisissez un restaurant pour organiser son plan de salle.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          {/* Canvas */}
          <div
            ref={canvasRef}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            onPointerLeave={onCanvasPointerUp}
            className="relative h-[520px] w-full overflow-hidden rounded-lg border bg-muted/30"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(120,120,120,0.15) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          >
            {tables.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Ajoutez une table puis glissez-la pour la positionner.
              </div>
            ) : null}
            {tables.map((t) => {
              const isSelected = t.id === selectedTableId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onPointerDown={(e) => onTablePointerDown(e, t)}
                  className={
                    'absolute flex flex-col items-center justify-center rounded-lg border text-xs font-medium shadow-sm transition-shadow touch-none ' +
                    (isSelected
                      ? 'border-yellow-500 bg-yellow-100 text-black ring-2 ring-yellow-400'
                      : 'border-border bg-card hover:shadow-md')
                  }
                  style={{
                    left: t.posX,
                    top: t.posY,
                    width: TABLE_W,
                    height: TABLE_H,
                    cursor: 'grab'
                  }}
                >
                  <span className="text-sm font-semibold">{t.label}</span>
                  {t.seats != null ? (
                    <span className="mt-0.5 flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {t.seats}
                    </span>
                  ) : null}
                  {t.zoneId ? (
                    <span className="mt-0.5 max-w-[64px] truncate text-[9px] text-muted-foreground">
                      {zoneName(t.zoneId)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Side panel: zones + selected table editor */}
          <div className="space-y-6">
            {/* Zones */}
            <div className="space-y-2">
              <Label>Zones</Label>
              <div className="flex gap-2">
                <Input
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="ex. Terrasse"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addZone();
                    }
                  }}
                />
                <Button variant="outline" size="icon" onClick={addZone}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ul className="space-y-1">
                {zones.length === 0 ? (
                  <li className="text-xs text-muted-foreground">
                    Aucune zone. (facultatif)
                  </li>
                ) : (
                  zones.map((z) => (
                    <li
                      key={z.id}
                      className="flex items-center justify-between rounded-md border px-2 py-1 text-sm"
                    >
                      <span className="truncate">{z.name}</span>
                      <button
                        type="button"
                        aria-label={`Supprimer la zone ${z.name}`}
                        onClick={() => removeZone(z.id)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Selected table editor */}
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-medium">
                {selectedTable
                  ? `Table ${selectedTable.label}`
                  : 'Aucune table sélectionnée'}
              </p>
              {selectedTable ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="tbl-label">Numéro / nom</Label>
                    <Input
                      id="tbl-label"
                      value={selectedTable.label}
                      onChange={(e) =>
                        updateTable(selectedTable.id, {
                          label: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tbl-seats">Places</Label>
                    <Input
                      id="tbl-seats"
                      type="number"
                      min={0}
                      value={selectedTable.seats ?? ''}
                      onChange={(e) =>
                        updateTable(selectedTable.id, {
                          seats:
                            e.target.value === ''
                              ? null
                              : Number(e.target.value)
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Zone</Label>
                    <Select
                      value={selectedTable.zoneId ?? NO_ZONE}
                      onValueChange={(v) =>
                        updateTable(selectedTable.id, {
                          zoneId: v === NO_ZONE ? null : v
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_ZONE}>Aucune zone</SelectItem>
                        {zones.map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-500 hover:text-red-600"
                    onClick={() => removeTable(selectedTable.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer la table
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Cliquez sur une table pour la modifier, ou glissez-la pour la
                  déplacer.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
