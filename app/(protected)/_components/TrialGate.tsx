'use client';

import { usePathname } from 'next/navigation';

import { TrialLock } from './TrialLock';

/**
 * Renders the full-screen trial-expired lock across the protected app when the
 * owner's FREE trial has ended. Allowed exceptions: the account/settings page
 * (where the owner upgrades) so the "Passer au forfait Starter" CTA is
 * reachable. On every other protected route the lock covers the app entirely,
 * blocking navigation and editing.
 */
const ALLOWED_WHILE_LOCKED = ['/settings'];

export function TrialGate({ owner }: { owner: boolean }) {
  const pathname = usePathname();
  const allowed = ALLOWED_WHILE_LOCKED.some((p) => pathname.startsWith(p));
  if (allowed) return null;
  return <TrialLock owner={owner} />;
}
