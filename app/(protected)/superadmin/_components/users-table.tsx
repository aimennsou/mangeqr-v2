'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Ban,
  CheckCircle2,
  Loader2,
  Search,
  Trash2,
  CreditCard,
  XCircle
} from 'lucide-react';
import { Plan, PlanPaymentMethod, UserRole } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { SuperadminUserRow } from '@/data/superadmin';
import { Switch } from '@/components/ui/switch';
import {
  superadminSetUserPlan,
  superadminSetSuspended,
  superadminDeleteUser,
  superadminSetOrderingEnabled,
  superadminCancelSubscription
} from '@/actions/superadmin';

interface UsersTableProps {
  initialUsers: SuperadminUserRow[];
  initialTotal: number;
  pageSize: number;
}

/** FR date formatting for the expiry column. */
function formatDate(value: Date | string | null): string {
  if (!value) return 'Aucune';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return 'Aucune';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function roleBadgeVariant(
  role: UserRole
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (role === UserRole.SUPERADMIN) return 'destructive';
  if (role === UserRole.ADMIN) return 'default';
  return 'secondary';
}

export function UsersTable({
  initialUsers,
  initialTotal,
  pageSize
}: UsersTableProps) {
  const router = useRouter();
  const [users, setUsers] = useState<SuperadminUserRow[]>(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Plan dialog state.
  const [planTarget, setPlanTarget] = useState<SuperadminUserRow | null>(null);
  const [planValue, setPlanValue] = useState<Plan>(Plan.STARTER);
  const [methodValue, setMethodValue] = useState<PlanPaymentMethod>(
    PlanPaymentMethod.CASH
  );
  const [expiryValue, setExpiryValue] = useState<string>('');

  // Delete confirm state.
  const [deleteTarget, setDeleteTarget] = useState<SuperadminUserRow | null>(
    null
  );

  // Cancel-online-subscription confirm state.
  const [cancelTarget, setCancelTarget] = useState<SuperadminUserRow | null>(
    null
  );

  const fetchUsers = useCallback(
    async (nextSkip: number, nextSearch: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          skip: String(nextSkip),
          take: String(pageSize)
        });
        if (nextSearch.trim()) params.set('search', nextSearch.trim());

        const res = await fetch(`/api/superadmin/users?${params.toString()}`);
        if (!res.ok) {
          throw new Error('failed');
        }
        const data: { users: SuperadminUserRow[]; total: number } =
          await res.json();
        setUsers(data.users);
        setTotal(data.total);
      } catch {
        toast.error('Impossible de charger les utilisateurs.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  // Debounced search: reset to first page and refetch.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSkip(0);
      fetchUsers(0, search);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const refresh = useCallback(() => {
    fetchUsers(skip, search);
    router.refresh();
  }, [fetchUsers, skip, search, router]);

  const goPrev = () => {
    const next = Math.max(0, skip - pageSize);
    setSkip(next);
    fetchUsers(next, search);
  };

  const goNext = () => {
    const next = skip + pageSize;
    if (next >= total) return;
    setSkip(next);
    fetchUsers(next, search);
  };

  // ---- Plan dialog ----
  const openPlanDialog = (user: SuperadminUserRow) => {
    setPlanTarget(user);
    setPlanValue(user.plan);
    setMethodValue(user.planPaymentMethod);
    setExpiryValue(
      user.planRenewsAt
        ? new Date(user.planRenewsAt).toISOString().slice(0, 10)
        : ''
    );
  };

  const setExpiryFromNow = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setExpiryValue(d.toISOString().slice(0, 10));
  };

  const submitPlan = () => {
    if (!planTarget) return;
    // A date input yields YYYY-MM-DD; convert to an ISO datetime (or null).
    const renewsAt = expiryValue
      ? new Date(`${expiryValue}T00:00:00.000Z`).toISOString()
      : null;

    startTransition(async () => {
      const result = await superadminSetUserPlan({
        userId: planTarget.id,
        plan: planValue,
        planPaymentMethod: methodValue,
        planRenewsAt: renewsAt
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.success ?? 'Abonnement mis à jour.');
      setPlanTarget(null);
      refresh();
    });
  };

  // ---- Suspend toggle ----
  const toggleSuspend = (user: SuperadminUserRow) => {
    const suspend = !user.suspended;
    let reason: string | undefined;
    if (suspend) {
      const input = window.prompt(
        'Motif de la suspension (facultatif) :',
        ''
      );
      // A null return means the user cancelled the prompt.
      if (input === null) return;
      reason = input.trim() || undefined;
    }

    startTransition(async () => {
      const result = await superadminSetSuspended({
        userId: user.id,
        suspended: suspend,
        reason
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.success ?? 'Compte mis à jour.');
      refresh();
    });
  };

  // ---- Ordering enable/disable (FEAT-1/D16) ----
  const toggleOrdering = (user: SuperadminUserRow, enabled: boolean) => {
    // Optimistically reflect the toggle.
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, orderingEnabled: enabled } : u
      )
    );
    startTransition(async () => {
      const result = await superadminSetOrderingEnabled({
        userId: user.id,
        enabled
      });
      if (result?.error) {
        toast.error(result.error);
        // Revert on failure.
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, orderingEnabled: !enabled } : u
          )
        );
        return;
      }
      toast.success(result?.success ?? 'Mis à jour.');
    });
  };

  // ---- Cancel online (Stripe) subscription ----
  const confirmCancelSubscription = () => {
    if (!cancelTarget) return;
    const target = cancelTarget;
    startTransition(async () => {
      const result = await superadminCancelSubscription({ userId: target.id });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.success ?? 'Abonnement annulé.');
      setCancelTarget(null);
      refresh();
    });
  };

  // ---- Delete ----
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await superadminDeleteUser({ userId: target.id });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.success ?? 'Utilisateur supprimé.');
      setDeleteTarget(null);
      refresh();
    });
  };

  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + pageSize, total);
  const busy = loading || isPending;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par email ou nom…"
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Abonnement</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Restaurants</TableHead>
              <TableHead>État</TableHead>
              <TableHead>Commandes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  {busy ? 'Chargement…' : 'Aucun utilisateur.'}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isSuperadmin = user.role === UserRole.SUPERADMIN;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {user.name ?? '—'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email ?? '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                          {user.plan}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {user.planPaymentMethod === PlanPaymentMethod.CASH
                            ? 'Espèces'
                            : 'En ligne'}
                          {user.stripeSubscriptionId ? (
                            <Badge
                              variant="outline"
                              className="ml-1 border-yellow-400/60 text-[10px] font-normal text-yellow-600 dark:text-yellow-500"
                            >
                              Stripe
                            </Badge>
                          ) : null}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(user.planRenewsAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.restaurantCount}
                    </TableCell>
                    <TableCell>
                      {user.suspended ? (
                        <Badge variant="destructive">Suspendu</Badge>
                      ) : (
                        <Badge variant="success">Actif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Ordering enable/disable (FEAT-1/D16) — superadmin gates
                          ordering per account. */}
                      <Switch
                        checked={user.orderingEnabled}
                        disabled={busy || isSuperadmin}
                        onCheckedChange={(c) => toggleOrdering(user, c)}
                        aria-label="Activer les commandes"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => openPlanDialog(user)}
                        >
                          <CreditCard className="mr-1 h-4 w-4" />
                          Abonnement
                        </Button>
                        {user.stripeSubscriptionId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => setCancelTarget(user)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Annuler en ligne
                          </Button>
                        ) : null}
                        <Button
                          variant={user.suspended ? 'secondary' : 'outline'}
                          size="sm"
                          disabled={busy || isSuperadmin}
                          onClick={() => toggleSuspend(user)}
                        >
                          {user.suspended ? (
                            <>
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Réactiver
                            </>
                          ) : (
                            <>
                              <Ban className="mr-1 h-4 w-4" />
                              Suspendre
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={busy || isSuperadmin}
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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

      {/* Plan dialog */}
      <Dialog
        open={planTarget !== null}
        onOpenChange={(open) => !open && setPlanTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer l&apos;abonnement</DialogTitle>
            <DialogDescription>
              {planTarget?.email ?? planTarget?.name ?? ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={planValue}
                onValueChange={(v) => setPlanValue(v as Plan)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Plan.STARTER}>Starter</SelectItem>
                  <SelectItem value={Plan.PRO}>Pro</SelectItem>
                  <SelectItem value={Plan.PREMIUM}>Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select
                value={methodValue}
                onValueChange={(v) =>
                  setMethodValue(v as PlanPaymentMethod)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PlanPaymentMethod.CASH}>
                    Espèces
                  </SelectItem>
                  <SelectItem value={PlanPaymentMethod.ONLINE}>
                    En ligne
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date d&apos;expiration</Label>
              <Input
                type="date"
                value={expiryValue}
                onChange={(e) => setExpiryValue(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setExpiryFromNow(1)}
                >
                  +1 mois
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setExpiryFromNow(12)}
                >
                  +1 an
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpiryValue('')}
                >
                  Aucune
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPlanTarget(null)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button onClick={submitPlan} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel online subscription confirm */}
      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Annuler l&apos;abonnement en ligne ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;abonnement Stripe de{' '}
              <span className="font-medium text-foreground">
                {cancelTarget?.email ?? cancelTarget?.name ?? ''}
              </span>{' '}
              sera annulé à la fin de la période en cours. Le compte conserve son
              accès jusqu&apos;à son expiration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmCancelSubscription();
              }}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer l&apos;annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le compte de{' '}
              <span className="font-medium text-foreground">
                {deleteTarget?.email ?? deleteTarget?.name ?? ''}
              </span>{' '}
              et toutes ses données (restaurants, menus, avis…) seront
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
