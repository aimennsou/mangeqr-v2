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
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';

type Kind = 'BORNE' | 'TV' | 'BOTH';

// `value` is the wire format sent to the action and must stay in English; only
// the label is translated.
const KIND_OPTIONS: { value: Kind; labelKey: TranslationKey }[] = [
  { value: 'BOTH', labelKey: 'landing.devis.kindBoth' },
  { value: 'BORNE', labelKey: 'landing.devis.kindBorne' },
  { value: 'TV', labelKey: 'landing.devis.kindTv' },
];

/**
 * "Demander un devis" (#4). A gold pill (matching V2Button) that opens a dialog
 * collecting the prospect's contact info and devis sizing details (number of
 * restaurants, bornes, TVs, team). Submits to the public `requestDevis` action,
 * which records a DevisRequest and notifies the back-office.
 */
export default function V2DevisDialog({ label }: { label?: string }) {
  const { t } = useI18n();
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
      toast.error(t('landing.devis.required'));
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
      // `res.success` comes from the server action and is French-only today; the
      // dictionary value is the fallback. Translating server-action messages is
      // tracked separately (see the i18n follow-up notes).
      toast.success(res.success ?? t('landing.devis.sent'));
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
          {label ?? t('landing.devis.trigger')}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('landing.devis.title')}</DialogTitle>
          <DialogDescription>
            {t('landing.devis.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Kind */}
          <div className="space-y-2">
            <Label>{t('landing.devis.kind')}</Label>
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
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="devis-name">{t('landing.devis.name')}</Label>
              <Input
                id="devis-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('landing.devis.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devis-phone">{t('landing.devis.phone')}</Label>
              <Input
                id="devis-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('landing.devis.phonePlaceholder')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="devis-email">{t('landing.devis.email')}</Label>
              <Input
                id="devis-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('landing.devis.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devis-restaurant">
                {t('landing.devis.restaurant')}
              </Label>
              <Input
                id="devis-restaurant"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder={t('landing.devis.restaurantPlaceholder')}
              />
            </div>
          </div>

          {/* Sizing */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="devis-restaurants">
                {t('landing.devis.restaurantCount')}
              </Label>
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
              <Label htmlFor="devis-bornes">
                {t('landing.devis.borneCount')}
              </Label>
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
              <Label htmlFor="devis-tvs">
                {t('landing.devis.tvCount')}
              </Label>
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
            <Label htmlFor="devis-team">{t('landing.devis.team')}</Label>
            <Input
              id="devis-team"
              value={teamType}
              onChange={(e) => setTeamType(e.target.value)}
              placeholder={t('landing.devis.teamPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="devis-message">
              {t('landing.devis.message')}
            </Label>
            <Textarea
              id="devis-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('landing.devis.messagePlaceholder')}
              rows={3}
            />
          </div>

          <Button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
          >
            {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t('landing.devis.submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
