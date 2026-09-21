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
import {
  listRestaurantsForSuperadmin,
  countRestaurantsForSuperadmin
} from '@/data/superadmin';
import Logo from '@/components/Logo';

import { ContentLayout } from '../../_admin-panel/content-layout';
import { RestaurantsTable } from '../_components/restaurants-table';

const PAGE_SIZE = 20;

/**
 * SUPERADMIN — restaurants across all accounts. List, create (assigned to any
 * owner), edit, and delete. Server-guarded.
 */
export default async function SuperadminRestaurantsPage() {
  if (!(await canAccessBackoffice('restaurants'))) {
    redirect(DEFAULT_SIGNIN_REDIRECT);
  }

  const [restaurants, total] = await Promise.all([
    listRestaurantsForSuperadmin({ skip: 0, take: PAGE_SIZE }),
    countRestaurantsForSuperadmin({})
  ]);

  return (
    <ContentLayout title="Restaurants">
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
            <BreadcrumbPage>Restaurants</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mb-6 border-b border-border pb-6">
            <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Restaurants
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Gérez les restaurants de tous les comptes : créez-en pour un
              propriétaire, modifiez ou supprimez.
            </p>
          </div>
          <RestaurantsTable
            initialRestaurants={restaurants}
            initialTotal={total}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
