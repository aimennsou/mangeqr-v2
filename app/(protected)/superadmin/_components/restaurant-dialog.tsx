'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import CoverImageUpload from '@/components/CoverImageUpload';
import { getS3Url } from '@/lib/s3';
import { superadminUpsertRestaurant } from '@/actions/superadmin';
import type { SuperadminRestaurantRow } from '@/data/superadmin';

type OwnerOption = { id: string; label: string };
type Currency = 'EURO' | 'DOLLAR' | 'DINAR';

interface RestaurantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, edit this restaurant; otherwise create a new one. */
  restaurant?: SuperadminRestaurantRow | null;
}

/**
 * SUPERADMIN create/edit restaurant dialog. On create, an owner must be chosen
 * (bypassing the invite/owner-only guards). Reuses the shared CoverImageUpload.
 */
export function RestaurantDialog({
  open,
  onOpenChange,
  restaurant
}: RestaurantDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!restaurant;

  const [ownerId, setOwnerId] = useState('');
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState<Currency>('EURO');
  const [subdomain, setSubdomain] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [wifi, setWifi] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [google, setGoogle] = useState('');

  // Seed fields when the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (restaurant) {
      setName(restaurant.name ?? '');
      setAddress(restaurant.address ?? '');
      setPhone(restaurant.phone ?? '');
      setCurrency((restaurant.currency as Currency) ?? 'EURO');
      setSubdomain(restaurant.subdomain ?? '');
      setCoverPhoto(restaurant.coverPhoto ?? '');
      setWifi(restaurant.wifi ?? '');
      setWebsite(restaurant.website ?? '');
      setInstagram(restaurant.instagram ?? '');
      setTiktok(restaurant.tiktok ?? '');
      setGoogle(restaurant.google ?? '');
    } else {
      setOwnerId('');
      setName('');
      setAddress('');
      setPhone('');
      setCurrency('EURO');
      setSubdomain('');
      setCoverPhoto('');
      setWifi('');
      setWebsite('');
      setInstagram('');
      setTiktok('');
      setGoogle('');
    }
  }, [open, restaurant]);

  // Load owner options for create mode.
  useEffect(() => {
    if (!open || isEdit || owners.length > 0) return;
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
  }, [open, isEdit, owners.length]);

  const submit = () => {
    if (!isEdit && !ownerId) {
      toast.error('Choisissez un propriétaire.');
      return;
    }
    startTransition(async () => {
      const res = await superadminUpsertRestaurant({
        id: restaurant?.id,
        ownerUserId: isEdit ? undefined : ownerId,
        name,
        address,
        phone,
        currency,
        subdomain: subdomain || undefined,
        coverPhoto: coverPhoto || undefined,
        wifi: wifi || null,
        website: website || null,
        instagram: instagram || null,
        tiktok: tiktok || null,
        google: google || null
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Enregistré.');
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="font-serif-display text-2xl font-medium tracking-tight">
            {isEdit ? 'Modifier le restaurant' : 'Créer un restaurant'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? restaurant?.ownerEmail
                ? `Propriétaire : ${restaurant.ownerEmail}`
                : 'Modifier les informations du restaurant.'
              : 'Créez un restaurant et attribuez-le à un propriétaire.'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[62vh] space-y-4 overflow-y-auto px-6 py-5">
          <CoverImageUpload
            onUploaded={setCoverPhoto}
            initialUrl={coverPhoto ? getS3Url(coverPhoto) : null}
            changeLabel="Changer la photo"
            emptyLabel="Déposez une photo de couverture"
          />

          {!isEdit ? (
            <div className="grid gap-2">
              <Label>Propriétaire</Label>
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

          <div className="grid gap-2">
            <Label htmlFor="r-name">Nom</Label>
            <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Le Bistrot" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="r-address">Adresse</Label>
            <Input id="r-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 rue de la Paix, Paris" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="r-phone">Téléphone</Label>
              <Input id="r-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 1 23 45 67 89" />
            </div>
            <div className="grid gap-2">
              <Label>Devise</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EURO">Euro (€)</SelectItem>
                  <SelectItem value="DOLLAR">Dollar ($)</SelectItem>
                  <SelectItem value="DINAR">Dinar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="r-sub">Lien d&apos;accès (sous-domaine)</Label>
            <Input id="r-sub" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="le-bistrot" />
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Liens &amp; réseaux (optionnel)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="r-wifi">Wi-Fi</Label>
                <Input id="r-wifi" value={wifi} onChange={(e) => setWifi(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-web">Site web</Label>
                <Input id="r-web" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-ig">Instagram</Label>
                <Input id="r-ig" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="r-tt">TikTok</Label>
                <Input id="r-tt" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="r-g">Google (avis)</Label>
                <Input id="r-g" value={google} onChange={(e) => setGoogle(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <Button
            className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
            onClick={submit}
            disabled={isPending}
          >
            {isPending
              ? 'Enregistrement…'
              : isEdit
                ? 'Enregistrer'
                : 'Créer le restaurant'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
