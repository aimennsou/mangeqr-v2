'use client';

import { signOut } from 'next-auth/react';

interface SignOutButtonProps {
  children?: React.ReactNode;
}

/**
 * Client-side sign-out. Uses next-auth/react `signOut` with an explicit
 * `callbackUrl` so the browser reliably navigates to the sign-in page after the
 * session is cleared (a server-action signOut cleared the cookie but did not
 * move the page, so logout appeared to do nothing).
 */
export function SignOutButton({ children }: SignOutButtonProps) {
  return (
    <span
      onClick={() => signOut({ callbackUrl: '/auth/sign-in' })}
      className='cursor-pointer'
    >
      {children}
    </span>
  );
}
