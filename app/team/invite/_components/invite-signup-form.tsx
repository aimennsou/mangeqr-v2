'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpAndJoin } from '@/actions/team';

/**
 * Invite-without-account sign-up form (#13). Creates the account + membership in
 * one step via `signUpAndJoin`, then signs the user in with the same
 * credentials and sends them to the dashboard.
 */
export function InviteSignUpForm({
  code,
  defaultName,
  defaultEmail,
  defaultPhone,
}: {
  code: string;
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await signUpAndJoin({
        code,
        name,
        email,
        phone,
        password,
        confirm,
      });
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success);
      // Log in immediately with the freshly created credentials.
      const signInRes = await signIn('credentials', {
        email: res.email,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        // Account exists — send them to sign-in to finish.
        toast.info('Compte créé. Connectez-vous pour continuer.');
        router.push('/auth/sign-in');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inv-name">Nom complet</Label>
        <Input
          id="inv-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jean Dupont"
          autoComplete="name"
          disabled={isPending}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inv-email">Email</Label>
        <Input
          id="inv-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          autoComplete="email"
          disabled={isPending}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inv-phone">Téléphone (optionnel)</Label>
        <Input
          id="inv-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+213 …"
          autoComplete="tel"
          disabled={isPending}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="inv-password">Mot de passe</Label>
          <Input
            id="inv-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete="new-password"
            disabled={isPending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv-confirm">Confirmer</Label>
          <Input
            id="inv-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••"
            autoComplete="new-password"
            disabled={isPending}
            required
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-yellow-400 text-black hover:bg-yellow-400/90"
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )}
        Créer mon compte et rejoindre
      </Button>
    </form>
  );
}
