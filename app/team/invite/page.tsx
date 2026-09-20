import Link from 'next/link';
import { redirect } from 'next/navigation';

import { currentUserId } from '@/lib/authentication';
import { getPublicInviteByCode } from '@/data/workspace';
import Logo from '@/components/Logo';

import { InviteSignUpForm } from './_components/invite-signup-form';

/**
 * Public invite landing (#13). A person WITHOUT an account opens this from an
 * invite link (link + code), confirms/fills their contact and creates an
 * account that is immediately attached to the inviting workspace, then logs in.
 *
 * If the visitor is ALREADY signed in, we bounce them to the authenticated
 * redeem page (/team/join) which handles the membership for existing accounts.
 */
export default async function TeamInvitePage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const code = (searchParams.code ?? '').trim();

  // Signed-in visitors use the existing authenticated redeem flow.
  const userId = await currentUserId();
  if (userId) {
    redirect(`/team/join${code ? `?code=${encodeURIComponent(code)}` : ''}`);
  }

  const invite = code ? await getPublicInviteByCode(code) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-4 py-12 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {!invite ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="font-serif-display text-2xl font-light tracking-tight">
              Invitation invalide
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ce lien d&apos;invitation est invalide, expiré ou déjà utilisé.
              Demandez un nouveau lien à la personne qui vous a invité.
            </p>
            <Link
              href="/auth/sign-in"
              className="mt-6 inline-block text-sm font-medium text-yellow-600 hover:underline dark:text-yellow-500"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              Invitation d&apos;équipe
            </p>
            <h1 className="mt-1 font-serif-display text-2xl font-light tracking-tight">
              Rejoignez {invite.ownerName ?? "l'équipe"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {invite.label
                ? `Vous êtes invité comme « ${invite.label} ». `
                : ''}
              Créez votre compte pour rejoindre l&apos;espace de travail.
            </p>

            <div className="mt-6">
              <InviteSignUpForm
                code={invite.code}
                defaultName={invite.inviteeName ?? ''}
                defaultEmail={invite.inviteeEmail ?? ''}
                defaultPhone={invite.inviteePhone ?? ''}
              />
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Vous avez déjà un compte ?{' '}
              <Link
                href={`/auth/sign-in?callbackUrl=${encodeURIComponent(
                  `/team/join?code=${invite.code}`
                )}`}
                className="font-medium text-yellow-600 hover:underline dark:text-yellow-500"
              >
                Se connecter
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
