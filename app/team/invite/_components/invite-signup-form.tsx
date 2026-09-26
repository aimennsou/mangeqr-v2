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
import { useI18n } from '@/lib/i18n';
import { joinErrorKey, joinSuccessKey } from '@/lib/team-errors';

/**
 * Invite-without-account sign-up form (#13). Creates the account + membership in
 * one step via `signUpAndJoin`, then signs the user in with the same
 * credentials and sends them to the dashboard.
 *
 * Outcome toasts come from the action's CODE so they follow the page locale.
 * One exception: when the schema rejects the payload the action also returns the
 * precise French field message in `error`; that is more useful than the generic
 * translated "invalid data", so we prefer it for that single code.
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
  const { t } = useI18n();
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
        // `invalid_data` carries a field-specific French message that is more
        // actionable than the generic translated one; everything else is a
        // known condition with a proper translation.
        toast.error(
          res.reason && res.reason !== 'invalid_data'
            ? t(joinErrorKey(res.reason))
            : res.error
        );
        return;
      }
      toast.success(res.code ? t(joinSuccessKey(res.code)) : res.success);
      // Log in immediately with the freshly created credentials.
      const signInRes = await signIn('credentials', {
        email: res.email,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        // Account exists — send them to sign-in to finish.
        toast.info(t('invite.form.createdSignIn'));
        router.push('/auth/sign-in');
        return;
      }
      // Land the new member directly inside the app. A full navigation (not a
      // client router.push) ensures the fresh session cookie is picked up by
      // the server on the protected route.
      //
      // The destination comes from the ACTION, which derives it from the
      // permissions the owner granted. Hardcoding '/performances' here sent
      // members without that permission into a guard that bounced them straight
      // back out.
      window.location.assign(res.redirectTo);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inv-name">{t('invite.form.name')}</Label>
        <Input
          id="inv-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('invite.form.namePh')}
          autoComplete="name"
          disabled={isPending}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inv-email">{t('invite.form.email')}</Label>
        {/* dir="ltr" on the e-mail and phone inputs: neither is RTL text, and
            without it the "@", the "+" and the digit groups reorder as you type
            on an Arabic page. */}
        <Input
          id="inv-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('invite.form.emailPh')}
          autoComplete="email"
          disabled={isPending}
          dir="ltr"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inv-phone">{t('invite.form.phone')}</Label>
        <Input
          id="inv-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('invite.form.phonePh')}
          autoComplete="tel"
          disabled={isPending}
          dir="ltr"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="inv-password">{t('invite.form.password')}</Label>
          <Input
            id="inv-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isPending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inv-confirm">{t('invite.form.confirm')}</Label>
          <Input
            id="inv-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
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
          <Loader2 className="me-2 h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="me-2 h-4 w-4" />
        )}
        {t('invite.form.submit')}
      </Button>
    </form>
  );
}
