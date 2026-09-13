import Link from "next/link";
import { KeyRound, ShieldCheck, UserCog } from "lucide-react";

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
  listInvitations
} from "@/data/workspace";
import PlanCard from "./_components/plan-card";
import CopyIdButton from "./_components/copy-id-button";
import TeamSection from "./_components/team-section";
import TeamMemberCard from "./_components/team-member-card";

/** Build the copyable redeem link for an invite code (mirrors actions/team). */
function buildRedeemLink(code: string): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "";
  const path = `/team/join?code=${encodeURIComponent(code)}`;
  return origin ? `${origin}${path}` : path;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  USER: "Utilisateur"
};

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
  const [restaurantCount, menuCount, campaignCount] = userId
    ? await Promise.all([
        db.restaurant.count({ where: { userId } }),
        db.menu.count({ where: { restaurant: { userId } } }),
        db.marketingCampaign.count({ where: { restaurant: { userId } } })
      ])
    : [0, 0, 0];

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
    }[];
    invites: { id: string; code: string; link: string }[];
  } | null = null;
  let teamOwnerName: string | null = null;

  if (userId && workspace.role === "OWNER") {
    const [seats, members, invitations] = await Promise.all([
      canAddMember(userId),
      listMembers(userId),
      listInvitations(userId)
    ]);
    teamOwnerSection = {
      used: seats.used,
      limit: seats.limit,
      members: members.map((m) => ({
        membershipId: m.membershipId,
        name: m.name,
        email: m.email,
        image: m.image
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
    <ContentLayout title="Mon compte">
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
            <BreadcrumbPage>Mon compte</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* One white section wrapping the whole account page (like performances). */}
      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6 space-y-6">

      {/* Profil : pleine largeur en haut */}
      <div>
        {/* Résumé du profil */}
        <Card className="rounded-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg md:text-xl font-semibold">Profil</h3>
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
                  {name ?? "Utilisateur"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {email ?? "—"}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {ROLE_LABELS[role] ?? role}
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
        />

        {/* Section de mise à jour du profil */}
        <Card className="rounded-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg md:text-xl font-semibold">Paramètres du profil</h3>
            </div>
          </CardHeader>
          <CardContent>
            <UpdateProfileForm />
          </CardContent>
        </Card>

        {/* Section de mise à jour du mot de passe */}
        <Card className="rounded-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg md:text-xl font-semibold">Mettre à jour le mot de passe</h3>
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
      </div>

        </CardContent>
      </Card>
    </ContentLayout>
  );
}
