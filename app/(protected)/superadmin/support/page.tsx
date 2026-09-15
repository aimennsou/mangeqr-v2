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
import { listSupportMessages } from '@/data/superadmin';
import Logo from '@/components/Logo';

import { ContentLayout } from '../../_admin-panel/content-layout';
import { SupportInbox } from '../_components/support-inbox';

/**
 * SUPERADMIN — support inbox. Lists contact-form messages persisted from the
 * landing page, with triage (mark read / resolved). Server-guarded.
 */
export default async function SuperadminSupportPage() {
  const role = await currentRole();
  if (role !== UserRole.SUPERADMIN) {
    redirect(DEFAULT_SIGNIN_REDIRECT);
  }

  const messages = await listSupportMessages({ skip: 0, take: 100 });

  return (
    <ContentLayout title="Messages">
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
            <BreadcrumbPage>Messages</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="mb-6 border-b border-border pb-6">
            <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Messages support
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {messages.length} message{messages.length > 1 ? 's' : ''} reçu
              {messages.length > 1 ? 's' : ''}. Cliquez pour lire et répondre.
            </p>
          </div>
          <SupportInbox messages={messages} />
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
