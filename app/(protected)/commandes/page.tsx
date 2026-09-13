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

import { ContentLayout } from '../_admin-panel/content-layout';
import { OrdersBoard } from '../_components/orders/OrdersBoard';

/**
 * FEAT-1 — Owner "Commandes" page. Live queue of incoming orders grouped by
 * table (dine-in) and a delivery group, with order numbers, items, and status
 * transitions. New orders trigger a sound + visual highlight.
 */
export default function CommandesPage() {
  return (
    <ContentLayout title="Commandes">
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
            <BreadcrumbPage>Commandes</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <OrdersBoard />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
