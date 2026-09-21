import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { canAccessBackoffice } from '@/lib/backoffice';
import { DEFAULT_SIGNIN_REDIRECT } from '@/routes';
import { listDevisRequests } from '@/data/superadmin';
import Logo from '@/components/Logo';

import { ContentLayout } from '../../_admin-panel/content-layout';
import { DevisTable } from '../_components/devis-table';

/**
 * SUPERADMIN — hardware quote requests ("Demandes de devis", #4). Prospects
 * submit a devis for bornes and/or TV screens from the landing "Kit
 * restaurateur" section; the back-office follows up (call, quote, close).
 * Server-guarded.
 */
export default async function SuperadminDevisPage() {
  if (!(await canAccessBackoffice('devis'))) {
    redirect(DEFAULT_SIGNIN_REDIRECT);
  }

  const requests = await listDevisRequests({ take: 100 });
  const fresh = requests.filter((r) => r.status === 'NEW').length;

  return (
    <ContentLayout title="Demandes de devis">
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
            <BreadcrumbPage>Demandes de devis</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mb-6 border-b border-border pb-6">
            <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Demandes de devis
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Demandes de matériel (bornes &amp; écrans TV) depuis le site.{' '}
              {fresh > 0 ? `${fresh} nouvelle(s) à traiter.` : ''}
            </p>
          </div>
          <DevisTable requests={requests} />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
