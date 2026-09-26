'use client';

import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

import { SupportDialog } from '@/components/support/support-dialog';
import { SUPPORT_PHONE } from '@/config';
import { useI18n } from '@/lib/i18n';
import { PAGE_CONTAINER } from './page-container';

/**
 * Dashboard footer: the support phone number plus a quick-access "contact
 * support" dialog, available on every protected page.
 *
 * A client component so the hint text follows a locale switch immediately — it
 * was previously hardcoded French and stayed French on Arabic pages.
 */
export function Footer() {
  const { t } = useI18n();

  return (
    <div className="z-20 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Same column as the navbar and the page body, so all three share one
          horizontal grid instead of the footer measuring from the window edge. */}
      <div className={`${PAGE_CONTAINER} flex h-14 flex-row items-center gap-3`}>
        <ExclamationTriangleIcon className="shrink-0 text-yellow-400" />
        <p className="flex min-w-0 flex-wrap items-center text-xs leading-loose text-muted-foreground md:text-sm">
          {t('support.footerHint')}
          <a
            href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
            className="mx-1 font-medium underline underline-offset-4 hover:text-foreground"
            dir="ltr"
          >
            {SUPPORT_PHONE}
          </a>
        </p>
        <div className="ms-auto shrink-0">
          <SupportDialog />
        </div>
      </div>
    </div>
  );
}
