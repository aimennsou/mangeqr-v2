import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { canAccessBackoffice } from '@/lib/backoffice';
import { DEFAULT_SIGNIN_REDIRECT } from '@/routes';
import { listUsers, countUsers } from '@/data/superadmin';
import Logo from '@/components/Logo';

import { ContentLayout } from '../../_admin-panel/content-layout';
import { UsersTable } from '../_components/users-table';
import { CreateUserDialog } from '../_components/create-user-dialog';

const PAGE_SIZE = 20;

/**
 * SUPERADMIN — users & subscriptions. Lists all accounts with plan/subscription
 * management (cash + online), blacklist (suspend), delete, and account creation
 * (including tying a new user to an owner as a team member, bypassing invites).
 */
export default async function SuperadminUsersPage() {
  // SUPERADMIN or an ADMIN granted the "users" back-office permission (#2).
  if (!(await canAccessBackoffice('users'))) {
    redirect(DEFAULT_SIGNIN_REDIRECT);
  }

  const [users, total] = await Promise.all([
    listUsers({ skip: 0, take: PAGE_SIZE }),
    countUsers({})
  ]);

  return (
    <ContentLayout title="Utilisateurs">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/superadmin" className="flex mx-auto justify-center items-center gap-2">
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
            <BreadcrumbPage>Utilisateurs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
                Utilisateurs &amp; abonnements
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Gérez les comptes, les abonnements (espèces &amp; en ligne),
                suspendez ou supprimez des comptes.
              </p>
            </div>
            <CreateUserDialog />
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
