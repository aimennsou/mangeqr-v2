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

import { ContentLayout } from '../../_admin-panel/content-layout';
import { KitchenBoard } from '../../_components/orders/KitchenBoard';

/**
 * Client shell for the kitchen page. Split out of `page.tsx` so the page itself
 * can be a server component and enforce the ordering-module + `orders`
 * permission guard before any of this renders.
 */
export function CuisineView() {
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
        <CardContent className="p-4 sm:p-6 lg:p-8">
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
