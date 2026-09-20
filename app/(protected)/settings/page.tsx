import Link from "next/link";
import { cookies } from "next/headers";
import { KeyRound, ShieldCheck, UserCog } from "lucide-react";
import { translate } from "@/lib/i18n/translate";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UpdateProfileForm from "@/components/auth/update-profile-form";
import UpdatePasswordForm from "@/components/auth/update-password-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { ContentLayout } from "../_admin-panel/content-layout";
import Logo from "@/components/Logo";
import { currentUser } from "@/lib/authentication";
import { getUserById } from "@/data/user";
import { getEffectivePlan } from "@/lib/plan";
import { db } from "@/lib/db";
import {
  getWorkspaceContext,
  canAddMember,
  listMembers,
  listInvitations,
  listWorkspaceActivity
} from "@/data/workspace";
import PlanCard from "./_components/plan-card";
import ActivityJournal from "./_components/activity-journal";
import CopyIdButton from "./_components/copy-id-button";
import TeamSection from "./_components/team-section";
import TeamMemberCard from "./_components/team-member-card";
import PrinterSettingsCard from "./_components/printer-settings-card";
import SupportCard from "./_components/support-card";
import SupportTickets from "./_components/support-tickets";
import { listSupportTicketsForUser } from "@/data/support";

/** Build the copyable redeem link for an invite code (mirrors actions/team). */
function buildRedeemLink(code: string): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "";
  const path = `/team/join?code=${encodeURIComponent(code)}`;
  return origin ? `${origin}${path}` : path;
}

function getInitials(name?: string | null, email?: string | null) {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default async function SettingsPage() {
  // Server component: resolve the locale from the cookie and translate with the
  // shared (pure) translator, since useI18n is client-only.
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = (key: TranslationKey) => translate(locale, key);

  const sessionUser = await currentUser();
  const user = sessionUser?.id ? await getUserById(sessionUser.id) : null;

  const name = user?.name ?? sessionUser?.name ?? null;
  const email = user?.email ?? sessionUser?.email ?? null;
  const image = user?.image ?? sessionUser?.image ?? null;
  const role = (user?.role ?? sessionUser?.role ?? "USER") as string;

  // Plan souscrit vs. plan effectif : ce dernier rétrograde vers Starter si
  // l'abonnement payant est expiré. On expose les deux pour rendre l'état lisible.
  const subscribedPlan = user?.plan ?? "STARTER";
  const planRenewsAt = user?.planRenewsAt ?? null;
  const planPaymentMethod = user?.planPaymentMethod ?? "CASH";
  const effectivePlan = getEffectivePlan({ plan: subscribedPlan, planRenewsAt });

  // Compteurs d'usage (parallélisés), portés à l'utilisateur courant.
  const userId = user?.id ?? sessionUser?.id ?? "";
  const [restaurantCount, menuCount, campaignCount, dinarCount] = userId
    ? await Promise.all([
        db.restaurant.count({ where: { userId } }),
        db.menu.count({ where: { restaurant: { userId } } }),
        db.marketingCampaign.count({ where: { restaurant: { userId } } }),
        // #2: an account with a DINAR restaurant is treated as Algerian → cash
        // upgrade flow (DZD prices + upgrade request instead of Stripe).
        db.restaurant.count({ where: { userId, currency: "DINAR" } })
      ])
    : [0, 0, 0, 0];
  const isAlgerian = dinarCount > 0;

  // The signed-in user's own support tickets (history + conversation).
  const supportTickets = userId
    ? await listSupportTicketsForUser(userId)
    : [];

  // Contexte d'espace de travail (mangeqr-team) : propriétaire vs. membre.
  // Le propriétaire voit la gestion d'équipe ; le membre voit une carte en
  // lecture seule indiquant l'espace auquel il appartient.
  const workspace = userId
    ? await getWorkspaceContext(userId)
    : { ownerId: userId, role: "OWNER" as const };

  let teamOwnerSection: {
    used: number;
    limit: number;
    members: {
      membershipId: string;
      name: string | null;
      email: string | null;
      image: string | null;
      permissions: import('@/lib/permissions').MemberPermission[];
    }[];
    invites: { id: string; code: string; link: string }[];
  } | null = null;
  let teamOwnerName: string | null = null;
  let memberActivity: {
    id: string;
    actorName: string | null;
    action: string;
    summary: string;
    createdAt: string;
  }[] = [];

  if (userId && workspace.role === "OWNER") {
    const [seats, members, invitations, activity] = await Promise.all([
      canAddMember(userId),
      listMembers(userId),
      listInvitations(userId),
      listWorkspaceActivity(userId, { take: 50 })
    ]);
    memberActivity = activity.map((a) => ({
      id: a.id,
      actorName: a.actorName,
      action: a.action,
      summary: a.summary,
      createdAt: a.createdAt.toISOString()
    }));
    teamOwnerSection = {
      used: seats.used,
      limit: seats.limit,
      members: members.map((m) => ({
        membershipId: m.membershipId,
        name: m.name,
        email: m.email,
        image: m.image,
        permissions: m.permissions
      })),
      invites: invitations.map((i) => ({
        id: i.id,
        code: i.code,
        link: buildRedeemLink(i.code)
      }))
    };
  } else if (userId && workspace.role === "MEMBER") {
    const owner = await db.user.findUnique({
      where: { id: workspace.ownerId },
      select: { name: true, email: true }
    });
    teamOwnerName = owner?.name ?? owner?.email ?? null;
  }

  return (
    <ContentLayout title={t("nav.account")}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard" className="flex mx-auto justify-center items-center gap-2">
                <Logo className="max-md:hidden" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("nav.account")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* One white section wrapping the whole account page (like performances). */}
      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6 space-y-8">

      {/* Editorial header */}
      <div className="border-b border-border pb-6">
        <h2 className="font-serif-display text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          {t("nav.account")}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("account.subheading")}
        </p>
      </div>

      {/* Profil : pleine largeur en haut */}
      <div>
        {/* Résumé du profil */}
        <Card className="rounded-xl border-border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h3 className="text-lg md:text-xl font-semibold">{t("account.profile")}</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {image ? <AvatarImage src={image} alt={name ?? "Avatar"} /> : null}
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials(name, email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">
                  {name ?? t("account.defaultUser")}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {email ?? "—"}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {role === "ADMIN"
                    ? t("account.roleAdmin")
                    : role === "USER"
                    ? t("account.roleUser")
                    : role}
                </Badge>
                {userId ? (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="shrink-0">ID ·</span>
                    <span className="truncate select-all font-mono">
                      {userId}
                    </span>
                    <CopyIdButton value={userId} />
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Les 4 autres sections : 2 par ligne */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Carte du plan (B.2) : statut actif/expiré, date d'expiration, usage vs. limites */}
        <PlanCard
          subscribedPlan={subscribedPlan}
          effectivePlan={effectivePlan}
          planRenewsAt={planRenewsAt}
          restaurantCount={restaurantCount}
          menuCount={menuCount}
          campaignCount={campaignCount}
          planPaymentMethod={planPaymentMethod}
          isAlgerian={isAlgerian}
        />

        {/* Section de mise à jour du profil */}
        <Card className="rounded-xl border-border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                <UserCog className="h-5 w-5" />
              </span>
              <h3 className="text-lg md:text-xl font-semibold">{t("account.profileSettings")}</h3>
            </div>
          </CardHeader>
          <CardContent>
            <UpdateProfileForm />
          </CardContent>
        </Card>

        {/* Section de mise à jour du mot de passe */}
        <Card className="rounded-xl border-border shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-600 dark:text-yellow-500">
                <KeyRound className="h-5 w-5" />
              </span>
              <h3 className="text-lg md:text-xl font-semibold">{t("account.updatePassword")}</h3>
            </div>
          </CardHeader>
          <CardContent>
            <UpdatePasswordForm />
          </CardContent>
        </Card>

        {/* Équipe (mangeqr-team) : gestion pour le propriétaire, lecture seule pour le membre */}
        {workspace.role === "OWNER" && teamOwnerSection ? (
          <TeamSection
            used={teamOwnerSection.used}
            limit={teamOwnerSection.limit}
            members={teamOwnerSection.members}
            invites={teamOwnerSection.invites}
          />
        ) : workspace.role === "MEMBER" ? (
          <TeamMemberCard ownerName={teamOwnerName} />
        ) : null}

        {/* Member activity journal (owner-only) */}
        {workspace.role === "OWNER" ? (
          <ActivityJournal entries={memberActivity} />
        ) : null}

        {/* Ticket-printer configuration (owner-only) — spans full width so the
            form has room for its controls. */}
        {workspace.role === "OWNER" ? (
          <div className="md:col-span-2">
            <PrinterSettingsCard />
          </div>
        ) : null}

        {/* In-app support — lets any authenticated user send a message that
            lands in the superadmin support inbox. Full width. */}
        <SupportCard
          title={t("account.support")}
          description={t("account.supportDesc")}
          defaultName={name}
          defaultEmail={email}
          labels={{
            name: t("account.support.name"),
            email: t("account.support.email"),
            message: t("account.support.message"),
            messagePlaceholder: t("account.support.messagePlaceholder"),
            submit: t("account.support.submit"),
            sending: t("account.support.sending")
          }}
        />

        {/* Support history — the user's own tickets + conversation. */}
        <SupportTickets
          tickets={supportTickets.map((tk) => ({
            id: tk.id,
            name: tk.name,
            email: tk.email,
            message: tk.message,
            status: tk.status,
            createdAt: tk.createdAt.toISOString(),
            updatedAt: tk.updatedAt.toISOString(),
            replies: tk.replies.map((r) => ({
              id: r.id,
              authorRole: r.authorRole,
              authorName: r.authorName,
              body: r.body,
              createdAt: r.createdAt.toISOString()
            }))
          }))}
          labels={{
            title: t("account.tickets.title"),
            description: t("account.tickets.desc"),
            empty: t("account.tickets.empty"),
            replyPlaceholder: t("account.tickets.replyPlaceholder"),
            reply: t("account.tickets.reply"),
            closed: t("account.tickets.closed"),
            statusNew: t("account.tickets.statusNew"),
            statusRead: t("account.tickets.statusRead"),
            statusResolved: t("account.tickets.statusResolved")
          }}
        />
      </div>

        </CardContent>
      </Card>
    </ContentLayout>
  );
}
