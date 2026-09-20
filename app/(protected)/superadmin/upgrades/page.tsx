import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { currentRole } from '@/lib/authentication';
import { DEFAULT_SIGNIN_REDIRECT } from '@/routes';
import { listUpgradeRequests } from '@/data/superadmin';
import Logo from '@/components/Logo';

import { ContentLayout } from '../../_admin-panel/content-layout';
import { UpgradesTable } from '../_components/upgrades-table';

/**
 * SUPERADMIN — cash plan-upgrade requests (#2). Algerian (DZD) accounts pay
 * offline, so upgrading is a request the back-office follows up on (call the
 * user, take payment, approve to grant the plan). Server-guarded.
 */
export default async function SuperadminUpgradesPage() {
  const role = await currentRole();
  if (role !== UserRole.SUPERADMIN) {
    redirect(DEFAULT_SIGNIN_REDIRECT);
  }

  const requests = await listUpgradeRequests({ take: 100 });
  const pending = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <ContentLayout title="Demandes de forfait">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href="/superadmin"
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
            <BreadcrumbPage>Demandes de forfait</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mb-6 border-b border-border pb-6">
            <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Demandes de mise à niveau
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Demandes de forfait en espèces (Algérie).{' '}
              {pending > 0 ? `${pending} en attente d'appel.` : ''}
            </p>
          </div>
          <UpgradesTable requests={requests} />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
