'use client';

import { useState } from 'react';
import { LifeBuoy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { SupportForm } from '@/components/support/support-form';
import { useI18n } from '@/lib/i18n';

/**
 * Quick-access "contact support" dialog.
 *
 * Mounted in the dashboard footer so it is reachable from every page. Before
 * this, sending a support message meant navigating to /settings and scrolling to
 * the support card — a poor path for someone who is stuck on another screen.
 *
 * Name and email are not prefilled here (the footer has no session data to
 * hand); the action falls back to the signed-in user server-side, and the fields
 * stay editable either way.
 */
export function SupportDialog() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-2 text-xs text-muted-foreground hover:text-foreground md:text-sm"
        >
          <LifeBuoy className="h-4 w-4" />
          {t('account.support')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t('account.support')}</DialogTitle>
          <DialogDescription>{t('account.supportDesc')}</DialogDescription>
        </DialogHeader>
        <SupportForm idPrefix="support-dialog" onSent={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
