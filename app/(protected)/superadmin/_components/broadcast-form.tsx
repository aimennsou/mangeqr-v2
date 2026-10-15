'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Megaphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { superadminBroadcast } from '@/actions/superadmin';

/**
 * Admin broadcast composer (#14). Sends an in-app notification to all users or
 * only paid-plan accounts. Appears in the SUPERADMIN dashboard.
 */
export function BroadcastForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [audience, setAudience] = useState<'ALL' | 'PAID'>('ALL');
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Le titre est requis.');
      return;
    }
    startTransition(async () => {
      const res = await superadminBroadcast({ title, body, link, audience });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Notification envoyée.');
      setTitle('');
      setBody('');
      setLink('');
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-xl border border-border p-5 sm:grid-cols-2"
    >
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="bc-title">Titre</Label>
        <Input
          id="bc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : Nouvelle fonctionnalité disponible"
        />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="bc-body">Message (optionnel)</Label>
        <Textarea
          id="bc-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Détail du message envoyé aux comptes…"
          rows={2}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="bc-link">Lien (optionnel)</Label>
        <Input
          id="bc-link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="/numerique"
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Audience</Label>
        <Select value={audience} onValueChange={(v) => setAudience(v as 'ALL' | 'PAID')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les comptes</SelectItem>
            <SelectItem value="PAID">Comptes payants (Pro/Premium)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-yellow-400 text-black hover:bg-yellow-400/90"
        >
          <Megaphone className="mr-2 h-4 w-4" />
          {isPending ? 'Envoi…' : 'Envoyer la notification'}
        </Button>
      </div>
    </form>
  );
}
