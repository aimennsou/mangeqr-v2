'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinWorkspace } from '@/actions/team';
import { useI18n } from '@/lib/i18n';
import { joinErrorKey, joinSuccessKey } from '@/lib/team-errors';

interface JoinFormProps {
  initialCode?: string;
}

/**
 * Redeem form for joining a workspace (mangeqr-team, T8 / R5.3). Prefilled with
 * the `?code=` query param. On success, toasts and redirects to the dashboard.
 *
 * The action returns an outcome CODE, not a sentence, so the toasts follow the
 * reader's locale. It also returns a French `error`/`success` string as a
 * fallback; we only use it if the code is missing.
 */
export default function JoinForm({ initialCode = '' }: JoinFormProps) {
  const { t } = useI18n();
  const [code, setCode] = useState(initialCode);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error(t('join.codeRequired'));
      return;
    }

    startTransition(async () => {
      const res = await joinWorkspace(trimmed);
      if ('error' in res) {
        toast.error(res.reason ? t(joinErrorKey(res.reason)) : res.error);
        return;
      }
      toast.success(res.code ? t(joinSuccessKey(res.code)) : res.success);
      // Destination comes from the action (derived from the granted
      // permissions), not a hardcoded '/performances' which is permission-gated.
      // A full navigation so the server sees the new membership on the next
      // request.
      window.location.assign(res.redirectTo);
    });
  };

  return (
    <form onSubmit={onSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='invite-code'>{t('join.codeLabel')}</Label>
        {/* dir="ltr": the code is an opaque A-Z/2-9 token, not RTL text, so it
            must not be re-ordered on an Arabic page. */}
        <Input
          id='invite-code'
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t('join.codePh')}
          autoComplete='off'
          spellCheck={false}
          className='font-mono tracking-widest'
          dir='ltr'
          disabled={isPending}
        />
      </div>
      <Button type='submit' disabled={isPending} className='w-full'>
        {isPending ? (
          <Loader2 className='me-2 h-4 w-4 animate-spin' />
        ) : (
          <LogIn className='me-2 h-4 w-4 rtl:rotate-180' />
        )}
        {t('join.submit')}
      </Button>
    </form>
  );
}
