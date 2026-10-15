import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import {
  authRoutes,
  isPublicPath,
  apiAuthPrefix,
  DEFAULT_SIGNIN_REDIRECT
} from '@/routes';
import authConfig from '@/auth.config';
import { extractSubdomainFromHost } from '@/lib/subdomain';

export const { auth } = NextAuth(authConfig);

export default auth((req: { auth?: any; nextUrl?: any; headers?: any }) => {
  const { nextUrl } = req;
  const isSignedIn = !!req.auth;

  // -------------------------------------------------------------------------
  // Subdomain routing: if the request arrives on <sub>.<rootDomain>, serve
  // that restaurant's diner menu. We rewrite (internal, URL stays as-is) to the
  // by-subdomain route. Only applies to page navigations on the subdomain host;
  // /api and /_next assets are left alone so the menu page can load its data.
  // Inert locally (subdomainRoutingEnabled() is false without a real root domain).
  // -------------------------------------------------------------------------
  const host: string | null =
    req.headers?.get?.('host') ?? nextUrl.host ?? null;
  const subdomain = extractSubdomainFromHost(host);

  if (subdomain) {
    const path = nextUrl.pathname;
    const isAsset =
      path.startsWith('/_next') ||
      path.startsWith('/api') ||
      path.startsWith('/images') ||
      path.includes('.');
    // Avoid rewrite loops if somehow already on the target.
    const alreadyRewritten = path.startsWith('/restaurant/by-subdomain');

    if (!isAsset && !alreadyRewritten) {
      const url = nextUrl.clone();
      url.pathname = `/restaurant/by-subdomain/${subdomain}${
        path === '/' ? '' : path
      }`;
      return NextResponse.rewrite(url);
    }
    // On a subdomain host, everything is public (diner-facing) — skip auth.
    return null;
  }

  // -------------------------------------------------------------------------
  // Standard auth flow (app host).
  // -------------------------------------------------------------------------
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  // Segment-boundary matching lives in routes.ts so the rule is stated once.
  // A bare startsWith here previously made /menu and /marketing public (both
  // start with the '/m' lead-menu prefix) and exposed the private /restaurant
  // owner list (public only as /restaurant/[id]).
  const isPublicRoute = isPublicPath(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return null;
  }

  if (isAuthRoute) {
    // A one-time token in the URL means the visitor is here to CONSUME that
    // token (password reset, e-mail verification), not to sign in. Bouncing them
    // to the dashboard just because they happen to have a session silently ate
    // the link — which is exactly what happened when an owner handed a member a
    // reset link while that member was still logged in on the same browser.
    // The token itself is the authorization, so letting it through is safe.
    const carriesOneTimeToken = !!nextUrl.searchParams?.get('token');

    if (isSignedIn && !carriesOneTimeToken) {
      return Response.redirect(new URL(DEFAULT_SIGNIN_REDIRECT, nextUrl));
    }
    return null;
  }

  if (!isSignedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return Response.redirect(
      new URL(`/auth/sign-in?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // -------------------------------------------------------------------------
  // Superadmin console: /superadmin/** is reserved for SUPERADMIN only
  // (superadmin, S4). Signed-out users are already redirected above (the route
  // is not public); signed-in non-superadmins are sent to the default page.
  // Server-side guards (layout/page/actions/API) remain authoritative.
  // -------------------------------------------------------------------------
  // NOTE: /superadmin is gated SERVER-SIDE in the page via currentRole()
  // (which reads the full session through the auth.ts jwt/session callbacks).
  // We intentionally do NOT role-check here: middleware runs on the Edge with
  // auth.config.ts only (no jwt/session callbacks), so req.auth.user.role is
  // NOT reliably populated — a check here wrongly redirected the real
  // SUPERADMIN to /performances. Signed-out users are still redirected above
  // (the route is not public).

  return null;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
};
