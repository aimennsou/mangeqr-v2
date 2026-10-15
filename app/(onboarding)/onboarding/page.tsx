import { redirect } from 'next/navigation';

import { currentUser } from '@/lib/authentication';
import { getUserById } from '@/data/user';
import { isWorkspaceMember } from '@/data/workspace';
import { DEFAULT_SIGNIN_REDIRECT } from '@/routes';

import OnboardingWizard from './_components/OnboardingWizard';

/**
 * First-login onboarding wizard (owners only). Server-guarded:
 *  - No session → sign-in (middleware also enforces this).
 *  - SUPERADMIN → their console (they don't onboard).
 *  - Already onboarded, or a workspace MEMBER (can't create restaurants) →
 *    straight to the app.
 * Otherwise, render the wizard.
 */
export default async function OnboardingPage() {
  const sessionUser = await currentUser();
  if (!sessionUser?.id) {
    redirect('/auth/sign-in');
  }

  const user = await getUserById(sessionUser.id);
  if (!user) {
    redirect('/auth/sign-in');
  }

  if (user.role === 'SUPERADMIN') {
    redirect('/superadmin');
  }

  if (user.onboardedAt || (await isWorkspaceMember(user.id))) {
    redirect(DEFAULT_SIGNIN_REDIRECT);
  }

  return (
    <OnboardingWizard
      userName={user.name ?? null}
      rootDomain={process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'mangeqr.com'}
    />
  );
}
