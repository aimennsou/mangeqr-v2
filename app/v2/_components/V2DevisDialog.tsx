'use client';

import { useState, useTransition } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { requestDevis } from '@/actions/devis';

type Kind = 'BORNE' | 'TV' | 'BOTH';

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'BOTH', label: 'Bornes + TV' },
  { value: 'BORNE', label: 'Bornes de commande' },
  { value: 'TV', label: 'Écrans & TV' },
];

/**
 * "Demander un devis" (#4). A gold pill (matching V2Button) that opens a dialog
 * collecting the prospect's contact info and devis sizing details (number of
 * restaurants, bornes, TVs, team). Submits to the public `requestDevis` action,
 * which records a DevisRequest and notifies the back-office.
 */
export default function V2DevisDialog({ label = 'Demander un devis' }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [kind, setKind] = useState<Kind>('BOTH');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantCount, setRestaurantCount] = useState('');
  const [borneCount, setBorneCount] = useState('');
  const [tvCount, setTvCount] = useState('');
  const [teamType, setTeamType] = useState('');
  const [message, setMessage] = useState('');

  const reset = () => {
    setKind('BOTH');
    setName('');
    setPhone('');
    setEmail('');
    setRestaurantName('');
    setRestaurantCount('');
    setBorneCount('');
    setTvCount('');
    setTeamType('');
    setMessage('');
  };

  const submit = () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Nom et téléphone sont requis.');
      return;
    }
    startTransition(async () => {
      const res = await requestDevis({
        kind,
        name,
        phone,
        email,
        restaurantName,
        restaurantCount: restaurantCount === '' ? undefined : Number(restaurantCount),
        borneCount: borneCount === '' ? undefined : Number(borneCount),
        tvCount: tvCount === '' ? undefined : Number(tvCount),
        teamType,
        message,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Demande envoyée.');
      reset();
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-yellow-400 px-8 py-4 text-lg font-bold text-black shadow-lg shadow-yellow-400/30 transition-transform hover:scale-[1.03]"
        >
          {label}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Demander un devis</DialogTitle>
          <DialogDescription>
            Parlez-nous de votre établissement et de vos besoins en matériel.
            Notre équipe vous recontacte avec une offre adaptée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Kind */}
          <div className="space-y-2">
            <Label>Matériel souhaité</Label>
            <div className="grid grid-cols-3 gap-2">
              {KIND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKind(opt.value)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                    kind === opt.value
                      ? 'border-yellow-400 bg-yellow-400/10 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="devis-name">Nom complet *</Label>
              <Input
                id="devis-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devis-phone">Téléphone *</Label>
              <Input
                id="devis-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex. 06 12 34 56 78"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="devis-email">E-mail</Label>
              <Input
                id="devis-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devis-restaurant">Nom du restaurant</Label>
              <Input
                id="devis-restaurant"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Votre établissement"
              />
            </div>
          </div>

          {/* Sizing */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="devis-restaurants">Nb. restaurants</Label>
              <Input
                id="devis-restaurants"
                type="number"
                min={0}
                value={restaurantCount}
                onChange={(e) => setRestaurantCount(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devis-bornes">Nb. bornes</Label>
              <Input
                id="devis-bornes"
                type="number"
                min={0}
                value={borneCount}
                onChange={(e) => setBorneCount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devis-tvs">Nb. écrans TV</Label>
              <Input
                id="devis-tvs"
                type="number"
                min={0}
                value={tvCount}
                onChange={(e) => setTvCount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="devis-team">Votre équipe</Label>
            <Input
              id="devis-team"
              value={teamType}
              onChange={(e) => setTeamType(e.target.value)}
              placeholder="Ex. 1 gérant + 5 serveurs, ou franchise multi-sites"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="devis-message">Message (facultatif)</Label>
            <Textarea
              id="devis-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre projet ou vos contraintes…"
              rows={3}
            />
          </div>

          <Button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Envoyer ma demande
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
