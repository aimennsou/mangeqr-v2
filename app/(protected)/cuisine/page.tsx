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
import { KitchenBoard } from '../_components/orders/KitchenBoard';

/**
 * FEAT-1 — Kitchen view (D17). A dedicated full-screen board of ACTIVE orders
 * organized by status column, for owner + members (staff). Polls for updates
 * and plays a chime on new orders.
 */
export default function CuisinePage() {
  return (
    <ContentLayout title="Cuisine">
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
            <BreadcrumbPage>Cuisine</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <KitchenBoard />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
