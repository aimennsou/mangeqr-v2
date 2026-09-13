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
import { FloorPlanEditor } from './_components/FloorPlanEditor';

/**
 * FEAT-2 — Owner floor-plan / table layout page ("Plan de salle").
 *
 * Lets the owner define zones and a drag-to-arrange layout of tables per
 * restaurant. Tables feed the diner ordering flow (FEAT-1): a diner picks their
 * table number when placing a dine-in order.
 */
export default function TablesPage() {
  return (
    <ContentLayout title="Plan de salle">
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
            <BreadcrumbPage>Plan de salle</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <FloorPlanEditor />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
