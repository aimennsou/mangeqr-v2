import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import {
  Banknote,
  CreditCard,
  MessageSquare,
  Package,
  ShoppingCart,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed
} from 'lucide-react';

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
import { getSuperadminMetrics } from '@/data/superadmin';
import Logo from '@/components/Logo';

import { ContentLayout } from '../_admin-panel/content-layout';
import { MetricCard } from './_components/metric-card';
import { BroadcastForm } from './_components/broadcast-form';

/**
 * SUPERADMIN dashboard (home) — global platform metrics. Server-guarded: even
 * though middleware redirects non-superadmins, we re-check the role here.
 */
export default async function SuperadminPage() {
  const role = await currentRole();
  if (role !== UserRole.SUPERADMIN) {
    redirect(DEFAULT_SIGNIN_REDIRECT);
  }

  const m = await getSuperadminMetrics();
  const fmt = new Intl.NumberFormat('fr-FR');
  const eur = (n: number) => `${fmt.format(n)} €`;

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
        <CardContent className="space-y-10 p-6">
          {/* Editorial header */}
          <div className="border-b border-border pb-6">
            <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
              Vue d&apos;ensemble
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Statistiques globales de la plateforme.
            </p>
          </div>

          {/* Comptes */}
          <section className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Comptes
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Utilisateurs"
                value={fmt.format(m.totalUsers)}
                sub={`${fmt.format(m.suspendedUsers)} suspendus`}
                icon={<Users />}
              />
              <MetricCard
                label="Abonnés actifs"
                value={fmt.format(m.activeSubscribers)}
                sub={`${fmt.format(m.expiredSubscribers)} expirés`}
                icon={<UserCheck />}
              />
              <MetricCard
                label="MRR estimé"
                value={eur(m.estimatedMrr)}
                sub="Abonnements payants actifs"
                icon={<TrendingUp />}
                accent
              />
              <MetricCard
                label="Répartition"
                value={`${m.onlineSubscribers} / ${m.cashSubscribers}`}
                sub="En ligne / espèces (actifs)"
                icon={<CreditCard />}
              />
            </div>
          </section>

          {/* Forfaits */}
          <section className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Forfaits
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Starter" value={fmt.format(m.byPlan.STARTER)} icon={<Banknote />} />
              <MetricCard label="Pro" value={fmt.format(m.byPlan.PRO)} icon={<CreditCard />} />
              <MetricCard label="Premium" value={fmt.format(m.byPlan.PREMIUM)} icon={<CreditCard />} />
            </div>
          </section>

          {/* Contenu & activité */}
          <section className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Contenu &amp; activité
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Restaurants" value={fmt.format(m.totalRestaurants)} icon={<Store />} />
              <MetricCard label="Menus" value={fmt.format(m.totalMenus)} icon={<UtensilsCrossed />} />
              <MetricCard label="Plats" value={fmt.format(m.totalDishes)} icon={<UtensilsCrossed />} />
              <MetricCard label="Commandes clients" value={fmt.format(m.totalDinerOrders)} icon={<ShoppingCart />} />
            </div>
          </section>

          {/* Commandes de designs + support */}
          <section className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Commandes de designs &amp; support
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/superadmin/design-orders" className="contents">
                <MetricCard
                  label="Commandes designs"
                  value={fmt.format(m.designOrders.total)}
                  sub={`${m.designOrders.pending} en attente · ${m.designOrders.inProgress} en cours`}
                  icon={<Package />}
                />
              </Link>
              <MetricCard
                label="Expédiées"
                value={fmt.format(m.designOrders.shipped)}
                sub={`${m.designOrders.delivered} livrées`}
                icon={<Package />}
              />
              <Link href="/superadmin/support" className="contents">
                <MetricCard
                  label="Messages support"
                  value={fmt.format(m.supportMessages.total)}
                  sub={`${m.supportMessages.unresolved} non traités`}
                  icon={<MessageSquare />}
                  accent={m.supportMessages.unresolved > 0}
                />
              </Link>
            </div>
          </section>

          {/* Broadcast (#14) */}
          <section className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Notification aux comptes
            </p>
            <BroadcastForm />
          </section>
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
