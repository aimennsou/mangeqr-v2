'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinWorkspace } from '@/actions/team';

interface JoinFormProps {
  initialCode?: string;
}

/**
 * Redeem form for joining a workspace (mangeqr-team, T8 / R5.3). Prefilled with
 * the `?code=` query param. On success, toasts and redirects to the dashboard;
 * on failure, shows the French error message returned by the action.
 */
export default function JoinForm({ initialCode = '' }: JoinFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error('Veuillez saisir un code.');
      return;
    }

    startTransition(async () => {
      const res = await joinWorkspace(trimmed);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success);
      router.push('/dashboard');
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='invite-code'>Code d&apos;invitation</Label>
        <Input
          id='invite-code'
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder='Ex : ABCD2345'
          autoComplete='off'
          spellCheck={false}
          className='font-mono tracking-widest'
          disabled={isPending}
        />
      </div>
      <Button type='submit' disabled={isPending} className='w-full'>
        {isPending ? (
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
        ) : (
          <LogIn className='mr-2 h-4 w-4' />
        )}
        Rejoindre l&apos;espace
      </Button>
    </form>
  );
}
