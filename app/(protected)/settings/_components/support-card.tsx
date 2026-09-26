'use client';

import { LifeBuoy } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SupportForm } from '@/components/support/support-form';
import { useI18n } from '@/lib/i18n';

interface SupportCardProps {
  /** Prefilled from the session; still editable. */
  defaultName?: string | null;
  defaultEmail?: string | null;
}

/**
 * In-app support form (account page). Sends a support message that persists to
 * the SupportMessage table — the same inbox the superadmin triages.
 *
 * Copy comes from `useI18n` here and in SupportForm. It used to arrive as props
 * from the server page, so every string was fixed at request time and kept the
 * previous language after a client-side locale switch, which is why this card
 * showed French on an otherwise Arabic page.
 */
export default function SupportCard({
  defaultName,
  defaultEmail
}: SupportCardProps) {
  const { t } = useI18n();

  return (
    <Card className="rounded-xl border-border shadow-none md:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold md:text-xl">
              {t('account.support')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('account.supportDesc')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <SupportForm
          idPrefix="support-card"
          defaultName={defaultName}
          defaultEmail={defaultEmail}
        />
      </CardContent>
    </Card>
  );
}
