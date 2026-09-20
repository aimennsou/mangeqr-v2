/**
 * An array of routes that are accessible to the public
 * These routes does not require authentication
 * @type {string[]}
 */
export const publicRoutes: string[] = ['/', '/v2', '/auth/email-verification', '/lp/ar'];

/**
 * Route prefixes that are publicly accessible (matched by startsWith, not exact).
 * `/restaurant/[id]` is the diner-facing menu served from a QR code and must
 * never require authentication.
 * @type {string[]}
 */
export const publicRoutePrefixes: string[] = [
  '/restaurant',
  '/embed',
  // Lead-gen funnel (paid ads): the funnel pages (/go/fr, /go/ar) and the
  // anonymous lead-menu preview (/m/[id]) must be reachable without auth.
  '/go',
  '/m',
  '/api/track',
  '/api/review',
  // FEAT-1 diner ordering: the order-submit API and the diner live status page
  // are used by unauthenticated diners (from the QR menu), so they're public.
  '/api/orders',
  '/order',
  // Stripe webhook: called by Stripe's servers (no user session); verified via
  // the signature secret instead of auth.
  '/api/stripe/webhook',
  // Invite-without-account (#13): the public invite landing where a person can
  // sign up + join a workspace from an invite link.
  '/team/invite',
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect signed in users to /settings
 * @type {string[]}
 */
export const authRoutes: string[] = [
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/error',
  '/auth/forgot-password',
  '/auth/reset-password'
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix: string = '/api/auth';

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_SIGNIN_REDIRECT: string = '/performances';
