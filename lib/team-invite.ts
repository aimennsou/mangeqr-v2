/**
 * Links for the team invite / credential flows — ONE definition each.
 *
 * WHY THIS MODULE EXISTS: `buildRedeemLink` was implemented TWICE, and the two
 * copies disagreed on the path:
 *
 *   - `actions/team/index.ts`            -> `/team/invite?code=…`  (PUBLIC)
 *   - `app/(protected)/settings/page.tsx` -> `/team/join?code=…`   (PROTECTED)
 *
 * The second one even carried the comment "mirrors actions/team" while doing the
 * opposite. The consequence was a real bug: the link shown right after clicking
 * "Générer un lien d'invitation" (returned by the action) worked for someone
 * with no account, but the link copied from the "Invitations en attente" list
 * (rendered by the settings page) pointed at the auth-gated `/team/join`, so the
 * invitee was bounced to the sign-in wall — exactly the "invitee needs an
 * account" symptom.
 *
 * `/team/invite` is the correct destination for a shared invite link. It is in
 * `publicRoutePrefixes`, it lets a person with no account sign up and join in one
 * step, and it redirects visitors who ARE signed in on to `/team/join` so the
 * "I already have an account" path still works from the same URL.
 */

/**
 * Origin for links a user will open in a browser.
 *
 * `NEXT_PUBLIC_APP_URL` first because that is what the invite flow has always
 * used. Falling back to a RELATIVE path is deliberate: a relative link is still
 * usable same-origin, whereas inventing `localhost` would hand out a link that
 * is broken for everyone but the developer.
 */
function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ??
    process.env.AUTH_URL?.replace(/\/+$/, '') ??
    ''
  );
}

/** Copyable invite link for a code. Always the PUBLIC landing. */
export function buildInviteLink(code: string): string {
  const path = `/team/invite?code=${encodeURIComponent(code)}`;
  return `${appOrigin()}${path}`;
}

/**
 * Copyable password-reset link for a one-time token.
 *
 * `AUTH_URL` comes first here, unlike `buildInviteLink`, so this agrees with the
 * link `lib/mail.ts` puts in the reset EMAIL (which is built from `AUTH_URL`
 * alone). If the two disagreed, an owner could hand over a link pointing at a
 * different origin than the one the member received by mail.
 */
export function buildPasswordResetLink(token: string): string {
  const origin =
    process.env.AUTH_URL?.replace(/\/+$/, '') ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ??
    '';
  return `${origin}/auth/reset-password?token=${encodeURIComponent(token)}`;
}
