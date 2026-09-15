'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
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
import { superadminCreateUser } from '@/actions/superadmin';

type Role = 'USER' | 'ADMIN' | 'SUPERADMIN';
type OwnerOption = { id: string; label: string };

/**
 * SUPERADMIN account creation. Creates a verified user directly. Optionally
 * ties the new user to an existing owner as a team MEMBER, bypassing the invite
 * flow. Owner options are fetched from the superadmin users API.
 */
export function CreateUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('USER');
  const [tieToOwner, setTieToOwner] = useState(false);
  const [ownerId, setOwnerId] = useState('');
  const [owners, setOwners] = useState<OwnerOption[]>([]);

  // Load candidate owners (all users; the action rejects invalid ones) when the
  // "tie to owner" toggle is turned on.
  useEffect(() => {
    if (!tieToOwner || owners.length > 0) return;
    (async () => {
      try {
        const res = await fetch('/api/superadmin/users?take=100');
        const data = res.ok ? await res.json() : { users: [] };
        setOwners(
          (data.users ?? []).map((u: any) => ({
            id: u.id,
            label: u.name ? `${u.name} (${u.email})` : u.email ?? u.id
          }))
        );
      } catch {
        setOwners([]);
      }
    })();
  }, [tieToOwner, owners.length]);

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('USER');
    setTieToOwner(false);
    setOwnerId('');
  };

  const submit = () => {
    if (tieToOwner && !ownerId) {
      toast.error('Choisissez un propriétaire.');
      return;
    }
    startTransition(async () => {
      const res = await superadminCreateUser({
        name,
        email,
        password,
        role,
        ownerUserId: tieToOwner ? ownerId : null
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Compte créé.');
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-yellow-400 text-black hover:bg-yellow-400/90">
          <UserPlus className="mr-2 h-4 w-4" /> Créer un compte
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[460px]">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="font-serif-display text-2xl font-medium tracking-tight">
            Créer un compte
          </DialogTitle>
          <DialogDescription>
            Le compte est créé vérifié, sans e-mail de confirmation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-2">
            <Label htmlFor="cu-name">Nom</Label>
            <Input id="cu-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Dupont" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cu-email">Email</Label>
            <Input id="cu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean@restaurant.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cu-pass">Mot de passe</Label>
            <Input id="cu-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 caractères min." />
          </div>
          <div className="grid gap-2">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Utilisateur</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border p-3">
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm">
                <span className="font-medium">Rattacher à un propriétaire</span>
                <span className="block text-xs text-muted-foreground">
                  Crée un membre d’équipe sans invitation.
                </span>
              </span>
              <Switch checked={tieToOwner} onCheckedChange={setTieToOwner} />
            </label>
            {tieToOwner ? (
              <div className="mt-3">
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le propriétaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <Button
            className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
            onClick={submit}
            disabled={isPending}
          >
            {isPending ? 'Création…' : 'Créer le compte'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
