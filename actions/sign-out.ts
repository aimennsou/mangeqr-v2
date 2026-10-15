'use server';

import { signOut as logOut } from '@/auth';

/**
 * Sign the user out and redirect to the sign-in page.
 *
 * NextAuth v5's `signOut` clears the session cookie; passing `redirectTo`
 * makes it also navigate (via a thrown redirect) so the browser actually
 * leaves the authenticated area. Without a redirect the cookie was cleared
 * but the page never moved, so logout appeared to "do nothing".
 */
export async function signOut() {
  await logOut({ redirectTo: '/auth/sign-in' });
}
