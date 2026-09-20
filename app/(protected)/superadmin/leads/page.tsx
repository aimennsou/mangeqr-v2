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
import { listLeads, listStaff } from '@/data/superadmin';
import Logo from '@/components/Logo';

import { ContentLayout } from '../../_admin-panel/content-layout';
import { LeadsTable } from '../_components/leads-table';

/**
 * SUPERADMIN — funnel leads (paid-ads). Anonymous visitors who built a menu
 * (and possibly ordered a QR design) via /go/fr or /go/ar land here so the team
 * can follow up and convert them into accounts. Server-guarded.
 */
export default async function SuperadminLeadsPage() {
  const role = await currentRole();
  // #11: leads console is open to SUPERADMIN and STAFF (back-office follow-up).
  if (role !== UserRole.SUPERADMIN && role !== UserRole.STAFF) {
    redirect(DEFAULT_SIGNIN_REDIRECT);
  }

  const [leads, staff] = await Promise.all([
    listLeads({ skip: 0, take: 100 }),
    listStaff(),
  ]);
  const ordered = leads.filter((l) => l.status === 'ORDERED').length;

  return (
    <ContentLayout title="Leads">
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
            <BreadcrumbPage>Leads</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mb-6 border-b border-border pb-6">
            <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Leads (campagnes)
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Menus créés via le tunnel publicitaire.{' '}
              {ordered > 0 ? `${ordered} avec commande de design.` : ''}
            </p>
          </div>
          <LeadsTable leads={leads} staff={staff} />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
