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
import { OrdersBoard } from '../_components/orders/OrdersBoard';

/**
 * FEAT-1 — Owner "Commandes" page. Live queue of incoming orders grouped by
 * table (dine-in) and a delivery group, with order numbers, items, and status
 * transitions. New orders trigger a sound + visual highlight.
 */
export default function CommandesPage() {
  const { t } = useI18n();
  return (
    <ContentLayout title={t('orders.heading')}>
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
            <BreadcrumbPage>{t('orders.heading')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mb-8 border-b border-border pb-6">
            <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              {t('orders.heading')}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t('orders.subheading')}
            </p>
          </div>
          <OrdersBoard />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
