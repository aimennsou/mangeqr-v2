import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { currentUserId } from '@/lib/authentication';
import { getPublicInviteByCode } from '@/data/workspace';
import { translate } from '@/lib/i18n/translate';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dirForLocale,
  isLocale,
  type Locale
} from '@/lib/i18n/config';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import { LanguageSwitcher } from '@/components/language-switcher';
import Logo from '@/components/Logo';

import { InviteSignUpForm } from './_components/invite-signup-form';

/**
 * Public invite landing (#13). A person WITHOUT an account opens this from an
 * invite link (link + code), confirms/fills their contact and creates an
 * account that is immediately attached to the inviting workspace, then logs in.
 *
 * If the visitor is ALREADY signed in, we bounce them to the authenticated
 * redeem page (/team/join) which handles the membership for existing accounts.
 *
 * Server component, so copy is resolved from the locale cookie with the pure
 * `translate` helper (useI18n is client-only). It renders a LanguageSwitcher
 * because this is the one screen where the visitor is brand new and has no
 * cookie yet — an Arabic-speaking staff member would otherwise be stuck reading
 * French with no way to change it. Switching works because `setLocale` calls
 * `router.refresh()`, which re-renders this server component.
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

  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = (key: TranslationKey) => translate(locale, key);

  const invite = code ? await getPublicInviteByCode(code) : null;

  return (
    <div
      // This page sits outside the app shell, so it sets its own direction
      // rather than inheriting one from a parent layout.
      dir={dirForLocale(locale)}
      className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-4 py-12 dark:bg-neutral-950"
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Logo />
          <LanguageSwitcher />
        </div>

        {!invite ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="font-serif-display text-2xl font-light tracking-tight">
              {t('invite.invalidTitle')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('invite.invalidBody')}
            </p>
            <Link
              href="/auth/sign-in"
              className="mt-6 inline-block text-sm font-medium text-yellow-600 hover:underline dark:text-yellow-500"
            >
              {t('invite.haveAccount')}
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-widest text-yellow-600 dark:text-yellow-500">
              {t('invite.eyebrow')}
            </p>
            <h1 className="mt-1 font-serif-display text-2xl font-light tracking-tight">
              {/* Owner name and role label are user data, so they go through
                  placeholders instead of string concatenation — each language
                  keeps its own word order and quotation marks. */}
              {t('invite.joinTitle').replace(
                '{owner}',
                invite.ownerName ?? t('invite.ownerFallback')
              )}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {invite.label
                ? `${t('invite.asRole').replace('{label}', invite.label)} `
                : ''}
              {t('invite.createAccount')}
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
              {t('invite.alreadyHave')}{' '}
              <Link
                href={`/auth/sign-in?callbackUrl=${encodeURIComponent(
                  `/team/join?code=${invite.code}`
                )}`}
                className="font-medium text-yellow-600 hover:underline dark:text-yellow-500"
              >
                {t('invite.signIn')}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
