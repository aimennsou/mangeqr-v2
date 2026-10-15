'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { FC, PropsWithChildren } from 'react';

/**
 * Dedicated client boundary for NextAuth's SessionProvider.
 *
 * `next-auth/react` is a client-only ESM module. Rendering `SessionProvider`
 * directly inside the async server-component root layout made webpack emit a
 * broken client reference (useSession resolved to undefined -> "useSession is
 * not a function"). Wrapping it in its own `'use client'` component — mirroring
 * how ThemeProvider wraps next-themes — gives webpack a clean client boundary.
 */
export const AuthProvider: FC<PropsWithChildren<{ session: Session | null }>> = ({
  session,
  children,
}) => <SessionProvider session={session}>{children}</SessionProvider>;
