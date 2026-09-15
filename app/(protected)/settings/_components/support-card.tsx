'use client';

import { useState, useTransition } from 'react';
import { LifeBuoy, Send, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sendSupportMessage } from '@/actions/support';

interface SupportCardProps {
  title: string;
  description: string;
  /** Prefilled from the session; still editable. */
  defaultName?: string | null;
  defaultEmail?: string | null;
  labels: {
    name: string;
    email: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    sending: string;
  };
}

/**
 * In-app support form (account page). Lets an authenticated user send a support
 * message that persists to the SupportMessage table — the same inbox the
 * superadmin triages. Name/email are prefilled from the session.
 */
export default function SupportCard({
  title,
  description,
  defaultName,
  defaultEmail,
  labels
}: SupportCardProps) {
  const [name, setName] = useState(defaultName ?? '');
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      toast.error('Votre message est trop court.');
      return;
    }
    startTransition(async () => {
      const res = await sendSupportMessage({ name, email, message });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(res.success ?? 'Message envoyé.');
      setMessage('');
    });
  };

  return (
    <Card className="rounded-xl border-border shadow-none md:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold md:text-xl">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="support-name">{labels.name}</Label>
              <Input
                id="support-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support-email">{labels.email}</Label>
              <Input
                id="support-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@restaurant.com"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="support-message">{labels.message}</Label>
            <Textarea
              id="support-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={labels.messagePlaceholder}
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
                  {labels.sending}
                  <RotateCw className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  {labels.submit}
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
