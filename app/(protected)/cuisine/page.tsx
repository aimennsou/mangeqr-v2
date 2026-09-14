'use client';

import Link from 'next/link';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { useI18n } from '@/lib/i18n';

import { ContentLayout } from '../_admin-panel/content-layout';
import { KitchenBoard } from '../_components/orders/KitchenBoard';

/**
 * FEAT-1 — Kitchen view (D17). A dedicated full-screen board of ACTIVE orders
 * organized by status column, for owner + members (staff). Polls for updates
 * and plays a chime on new orders.
 */
export default function CuisinePage() {
  const { t } = useI18n();
  return (
    <ContentLayout title={t('kitchen.heading')}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href="/dashboard"
                className="flex mx-auto justify-center items-center gap-2"
              >
                <Logo className="max-md:hidden" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('kitchen.heading')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mb-8 border-b border-border pb-6">
            <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              {t('kitchen.heading')}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('kitchen.subheading')}
            </p>
          </div>
          <KitchenBoard />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
