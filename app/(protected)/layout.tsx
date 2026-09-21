import AdminPanelLayout from "./_admin-panel/admin-panel-layout";
import { TrialGate } from "./_components/TrialGate";
import { currentUser } from "@/lib/authentication";
import { getWorkspaceContext } from "@/data/workspace";
import { db } from "@/lib/db";
import { isTrialExpired } from "@/lib/plan";

/**
 * Resolve whether the current user's workspace is FREE-trial-expired. Owners
 * are checked on their own plan; members inherit the OWNER's plan. Platform
 * roles (SUPERADMIN/STAFF) are never gated.
 */
async function resolveTrial(): Promise<
  { locked: false } | { locked: true; owner: boolean }
> {
  const user = await currentUser();
  if (!user?.id) return { locked: false };
  if (user.role === "SUPERADMIN" || user.role === "STAFF") {
    return { locked: false };
  }

  const { ownerId, role } = await getWorkspaceContext(user.id);
  const owner = await db.user.findUnique({
    where: { id: ownerId },
    select: { plan: true, planRenewsAt: true },
  });
  if (!owner) return { locked: false };

  if (isTrialExpired({ plan: owner.plan, planRenewsAt: owner.planRenewsAt })) {
    return { locked: true, owner: role === "OWNER" };
  }
  return { locked: false };
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trial = await resolveTrial();

  return (
    <AdminPanelLayout>
      {children}
      {trial.locked ? <TrialGate owner={trial.owner} /> : null}
    </AdminPanelLayout>
  );
}
