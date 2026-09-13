import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { currentRole } from '@/lib/authentication';
import { DEFAULT_SIGNIN_REDIRECT } from '@/routes';
import { listDesignOrders, countDesignOrders } from '@/data/superadmin';
import Logo from '@/components/Logo';

import { ContentLayout } from '../../_admin-panel/content-layout';
import { DesignOrdersTable } from '../_components/design-orders-table';

/**
 * SUPERADMIN — QR-design order fulfillment console (FEAT-6).
 *
 * Lists every account's physical QR-code / printed-menu design orders so the
 * superadmin can follow and advance their status
 * (PENDING → IN_PROGRESS → SHIPPED → DELIVERED, or CANCELLED).
 *
 * Server guard (defense in depth): re-check the role here and redirect so the
 * page never renders for anyone but a SUPERADMIN — never rely on middleware
 * alone.
 */

const PAGE_SIZE = 20;

export default async function SuperadminDesignOrdersPage() {
  const role = await currentRole();

  if (role !== UserRole.SUPERADMIN) {
    redirect(DEFAULT_SIGNIN_REDIRECT);
  }

  const [orders, total] = await Promise.all([
    listDesignOrders({ skip: 0, take: PAGE_SIZE }),
    countDesignOrders({})
  ]);

  return (
    <ContentLayout title="Commandes de designs">
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
            <BreadcrumbLink asChild>
              <Link href="/superadmin">Super Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Commandes de designs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Suivi des commandes de designs
            </h2>
            <p className="text-sm text-muted-foreground">
              Suivez et mettez à jour le statut de fabrication et de livraison
              des commandes de QR-codes et menus physiques.
            </p>
          </div>
          <DesignOrdersTable
            initialOrders={orders}
            initialTotal={total}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
