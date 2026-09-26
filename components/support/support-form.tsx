'use client';

import { useState, useTransition } from 'react';
import { RotateCw, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sendSupportMessage } from '@/actions/support';
import { useI18n } from '@/lib/i18n';

interface SupportFormProps {
  /** Prefilled from the session; still editable. */
  defaultName?: string | null;
  defaultEmail?: string | null;
  /** Called after a successful send — used by the dialog to close itself. */
  onSent?: () => void;
  /** Unique suffix for field ids, so the card and the dialog can coexist. */
  idPrefix?: string;
}

/**
 * The single support-message form.
 *
 * Reads its own copy through `useI18n` rather than taking label props. The
 * settings card used to receive every string from the server page, which meant
 * they were resolved at request time and stayed in the previous language when the
 * diner switched locale client-side — that is what left /settings rendering half
 * Arabic and half French.
 *
 * Shared by the settings card and the app-wide footer dialog so there is one
 * implementation of the submit path.
 */
export function SupportForm({
  defaultName,
  defaultEmail,
  onSent,
  idPrefix = 'support'
}: SupportFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState(defaultName ?? '');
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      toast.error(t('account.support.tooShort'));
      return;
    }
    startTransition(async () => {
      const res = await sendSupportMessage({ name, email, message });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? t('account.support.sent'));
      setMessage('');
      onSent?.();
    });
  };

  const fid = (field: string) => `${idPrefix}-${field}`;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={fid('name')}>{t('account.support.name')}</Label>
          <Input
            id={fid('name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jean Dupont"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fid('email')}>{t('account.support.email')}</Label>
          <Input
            id={fid('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@restaurant.com"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={fid('message')}>{t('account.support.message')}</Label>
        <Textarea
          id={fid('message')}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('account.support.messagePlaceholder')}
          className="resize-none"
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-yellow-400 text-black hover:bg-yellow-400/90"
        >
          {isPending ? (
            <>
              {t('account.support.sending')}
              <RotateCw className="ms-2 h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              {t('account.support.submit')}
              <Send className="ms-2 h-4 w-4 rtl:-scale-x-100" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
