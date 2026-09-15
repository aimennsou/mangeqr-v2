'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2, Loader2, Store } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
import { getS3Url } from '@/lib/s3';
import type { SuperadminRestaurantRow } from '@/data/superadmin';
import { superadminDeleteRestaurant } from '@/actions/superadmin';

import { RestaurantDialog } from './restaurant-dialog';

interface RestaurantsTableProps {
  initialRestaurants: SuperadminRestaurantRow[];
  initialTotal: number;
  pageSize: number;
}

export function RestaurantsTable({
  initialRestaurants,
  initialTotal,
  pageSize
}: RestaurantsTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRestaurants);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SuperadminRestaurantRow | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] =
    useState<SuperadminRestaurantRow | null>(null);

  const fetchRows = useCallback(
    async (nextSkip: number, nextSearch: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          skip: String(nextSkip),
          take: String(pageSize)
        });
        if (nextSearch.trim()) params.set('search', nextSearch.trim());
        const res = await fetch(
          `/api/superadmin/restaurants?${params.toString()}`
        );
        if (!res.ok) throw new Error('failed');
        const data: {
          restaurants: SuperadminRestaurantRow[];
          total: number;
        } = await res.json();
        setRows(data.restaurants);
        setTotal(data.total);
      } catch {
        toast.error('Impossible de charger les restaurants.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      setSkip(0);
      fetchRows(0, search);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const refresh = useCallback(() => {
    fetchRows(skip, search);
    router.refresh();
  }, [fetchRows, skip, search, router]);

  const goPrev = () => {
    const next = Math.max(0, skip - pageSize);
    setSkip(next);
    fetchRows(next, search);
  };
  const goNext = () => {
    const next = skip + pageSize;
    if (next >= total) return;
    setSkip(next);
    fetchRows(next, search);
  };

  const openCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };
  const openEdit = (r: SuperadminRestaurantRow) => {
    setEditTarget(r);
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const res = await superadminDeleteRestaurant({ id: target.id });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Restaurant supprimé.');
      setDeleteTarget(null);
      refresh();
    });
  };

  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + pageSize, total);
  const busy = loading || isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, adresse, propriétaire…"
            className="pl-9"
          />
        </div>
        <Button
          className="bg-yellow-400 text-black hover:bg-yellow-400/90"
          onClick={openCreate}
        >
          <Plus className="mr-2 h-4 w-4" /> Ajouter un restaurant
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead>Propriétaire</TableHead>
              <TableHead>Menus</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  {busy ? 'Chargement…' : 'Aucun restaurant.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {r.coverPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getS3Url(r.coverPhoto)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Store className="h-4 w-4 text-muted-foreground" />
                        )}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {r.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {r.subdomain ?? r.address}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">
                        {r.ownerName ?? '—'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.ownerEmail ?? '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.menuCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="mr-1 h-4 w-4" /> Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={busy}
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {from}–{to} sur {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy || skip === 0}
            onClick={goPrev}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || skip + pageSize >= total}
            onClick={goNext}
          >
            Suivant
          </Button>
        </div>
      </div>

      <RestaurantDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            setEditTarget(null);
            // Refresh on close so an edit/create is reflected.
            refresh();
          }
        }}
        restaurant={editTarget}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce restaurant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le restaurant{' '}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>{' '}
              et toutes ses données (menus, catégories, plats, avis…) seront
              définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
