'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CopyPlus,
  GripVertical,
  LayoutGrid,
  Pencil,
  Trash2,
  UtensilsCrossed
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ToggleGroup,
  ToggleGroupItem
} from '@/components/ui/toggle-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

const WEEKDAYS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi'
];

export interface MenuItem {
  id: string;
  name: string;
  availability: string[];
  state: string; // ACTIVE | INACTIVE
  position: number;
}

interface MenuCardsProps {
  menus: MenuItem[];
  /** Per-menu counts keyed by menu id. */
  categoryCounts: Record<string, number>;
  dishCounts: Record<string, number>;
  /** State setters lifted to the page so create/duplicate can update the list. */
  onChange: (updater: (prev: MenuItem[]) => MenuItem[]) => void;
}

// -----------------------------------------------------------------------------
// Sortable card wrapper
// -----------------------------------------------------------------------------
function SortableMenuCard({
  menu,
  children
}: {
  menu: MenuItem;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: menu.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined
  };

  const handle = (
    <button
      type="button"
      className="cursor-grab rounded-md p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
      aria-label="Réordonner"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(handle)}
    </div>
  );
}

export default function MenuCards({
  menus,
  categoryCounts,
  dishCounts,
  onChange
}: MenuCardsProps) {
  const { t } = useI18n();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Edit dialog state
  const [editTarget, setEditTarget] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState<string | undefined>();
  const [editAvailability, setEditAvailability] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openEdit = (menu: MenuItem) => {
    setEditTarget(menu);
    setEditError(undefined);
    setEditName(menu.name);
    setEditAvailability(menu.availability ?? []);
  };

  const persistOrder = async (ordered: MenuItem[]) => {
    try {
      await fetch('/api/menu/position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          ordered.map((m, i) => ({ menuId: m.id, position: i + 1 }))
        )
      });
    } catch {
      toast.error(t('menus.toast.submitError'));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = menus.findIndex((m) => m.id === active.id);
    const newIndex = menus.findIndex((m) => m.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(menus, oldIndex, newIndex);
    onChange(() => reordered);
    persistOrder(reordered);
  };

  const toggleState = async (menu: MenuItem, checked: boolean) => {
    const next = checked ? 'ACTIVE' : 'INACTIVE';
    onChange((prev) =>
      prev.map((m) => (m.id === menu.id ? { ...m, state: next } : m))
    );
    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: menu.id, state: next })
      });
      if (!res.ok) throw new Error('failed');
      toast.success(
        checked ? t('menus.toast.stateActive') : t('menus.toast.stateInactive')
      );
    } catch {
      onChange((prev) =>
        prev.map((m) => (m.id === menu.id ? { ...m, state: menu.state } : m))
      );
      toast.error(t('menus.toast.stateError'));
    }
  };

  const duplicate = async (menu: MenuItem) => {
    try {
      const res = await fetch('/api/menu/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuId: menu.id })
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result?.error || t('menus.toast.duplicateError'));
        return;
      }
      const dup: MenuItem = {
        id: result.menu.id,
        name: result.menu.name,
        availability: result.menu.availability ?? [],
        state: result.menu.state,
        position: result.menu.position
      };
      onChange((prev) => [...prev, dup]);
      toast.success(t('menus.toast.duplicated'));
    } catch {
      toast.error(t('menus.toast.duplicateError'));
    }
  };

  const submitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editName.trim()) {
      setEditError(t('validation.required'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editTarget.id,
          name: editName,
          availability: editAvailability,
          state: editTarget.state
        })
      });
      if (!res.ok) throw new Error('failed');
      onChange((prev) =>
        prev.map((m) =>
          m.id === editTarget.id
            ? { ...m, name: editName, availability: editAvailability }
            : m
        )
      );
      toast.success(t('menus.toast.updated'));
      setEditTarget(null);
    } catch {
      toast.error(t('menus.toast.deleteError'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/menu', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id })
      });
      if (!res.ok) throw new Error('failed');
      onChange((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      toast.success(t('menus.toast.deleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('menus.toast.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={menus.map((m) => m.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {menus.map((menu) => {
              const isActive = menu.state === 'ACTIVE';
              return (
                <SortableMenuCard key={menu.id} menu={menu}>
                  {(dragHandle) => (
                    <div
                      className={cn(
                        'flex h-full flex-col rounded-xl border bg-card p-5 transition-colors',
                        isActive ? 'border-border' : 'border-dashed border-border'
                      )}
                    >
                      {/* Header: name + active toggle + drag */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-serif-display text-xl font-medium tracking-tight text-foreground">
                            {menu.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {isActive
                              ? t('menus.toast.stateActive')
                              : t('menus.toast.stateInactive')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={isActive}
                            onCheckedChange={(c) => toggleState(menu, c)}
                            aria-label={t('menus.col.state')}
                          />
                          {dragHandle}
                        </div>
                      </div>

                      {/* Availability days */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {menu.availability.length > 0 ? (
                          menu.availability.map((day) => (
                            <Badge
                              key={day}
                              className="border border-green-700 bg-green-200 text-green-700 hover:bg-green-300 dark:bg-green-800 dark:text-green-400 dark:hover:bg-green-900"
                            >
                              {t(`common.days.${day}` as TranslationKey)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t('menus.col.availDays')} —
                          </span>
                        )}
                      </div>

                      {/* Counts */}
                      <div className="mb-4 mt-4 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <LayoutGrid className="h-3 w-3" />
                          {categoryCounts[menu.id] ?? 0}{' '}
                          {t('menus.count.categories')}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <UtensilsCrossed className="h-3 w-3" />
                          {dishCounts[menu.id] ?? 0} {t('menus.count.dishes')}
                        </Badge>
                      </div>

                      {/* Actions — pinned to the bottom so they align across
                          cards regardless of how many availability rows each
                          menu has. */}
                      <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
                        <Button
                          asChild
                          size="sm"
                          className="flex-1 bg-yellow-400 text-black hover:bg-yellow-400/90"
                        >
                          <Link href={`/categories?menuId=${menu.id}`}>
                            {t('menus.manageCategories')}
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          aria-label={t('menus.col.edit')}
                          onClick={() => openEdit(menu)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          aria-label={t('menus.col.duplicate')}
                          onClick={() => duplicate(menu)}
                        >
                          <CopyPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 text-red-500 hover:text-red-600"
                          aria-label={t('common.delete')}
                          onClick={() => setDeleteTarget(menu)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </SortableMenuCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('menus.edit.title')}</DialogTitle>
            <DialogDescription>{t('menus.create.desc')}</DialogDescription>
          </DialogHeader>
          <form className="grid items-start gap-4" onSubmit={submitEdit}>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-menu-name">{t('menus.field.name')} <span className="text-red-500">*</span></Label>
              <Input
                id="edit-menu-name"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  if (editError) setEditError(undefined);
                }}
                aria-invalid={!!editError}
                className={editError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                placeholder="e.g. Menu du jour"
              />
              {editError ? <p className="text-xs text-red-500">{editError}</p> : null}
            </div>
            <Label>{t('menus.field.availability')}</Label>
            <ToggleGroup
              size="lg"
              type="multiple"
              className="grid grid-cols-3 gap-2"
              value={editAvailability}
              onValueChange={setEditAvailability}
            >
              {WEEKDAYS.map((day) => (
                <ToggleGroupItem
                  key={day}
                  value={day}
                  aria-label={`Toggle ${day}`}
                  className="border border-border bg-transparent text-muted-foreground hover:bg-muted data-[state=on]:border-green-500 data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:hover:bg-green-200 dark:data-[state=on]:border-green-700 dark:data-[state=on]:bg-green-900/40 dark:data-[state=on]:text-green-400"
                >
                  {t(`common.days.${day}` as TranslationKey)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
            >
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('menus.delete.desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
