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
import { listUsers, countUsers } from '@/data/superadmin';
import Logo from '@/components/Logo';

import { ContentLayout } from '../_admin-panel/content-layout';
import { UsersTable } from './_components/users-table';

/**
 * SUPERADMIN console (superadmin, S6) — cash-subscription management.
 *
 * Server guard (defense in depth): even though middleware redirects
 * non-superadmins away from /superadmin, we re-check the role here and redirect
 * so the page never renders for anyone but a SUPERADMIN. Never rely on
 * middleware alone.
 */

const PAGE_SIZE = 20;

export default async function SuperadminPage() {
  const role = await currentRole();

  if (role !== UserRole.SUPERADMIN) {
    redirect(DEFAULT_SIGNIN_REDIRECT);
  }

  const [users, total] = await Promise.all([
    listUsers({ skip: 0, take: PAGE_SIZE }),
    countUsers({})
  ]);

  return (
    <ContentLayout title="Super Admin">
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
            <BreadcrumbPage>Super Admin</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Gestion des abonnements (espèces)
            </h2>
            <p className="text-sm text-muted-foreground">
              Gérez les abonnements payés en espèces, suspendez ou supprimez des
              comptes.
            </p>
          </div>
          <UsersTable
            initialUsers={users}
            initialTotal={total}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
