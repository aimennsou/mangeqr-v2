import type { Metadata } from 'next';

import { getAppUrl } from '@/lib/subdomain';
import FunnelWizard from '../_components/FunnelWizard';
import { FR_DICT } from '../_components/dict';

export const metadata: Metadata = {
  title: 'Créez votre menu QR gratuit en 2 minutes — MangeQR',
  description:
    'Créez votre carte numérique, obtenez votre QR code et votre lien à partager. Sans compte, sans installation.',
  robots: { index: false }
};

/**
 * French lead-gen funnel (paid ads). LTR. Anonymous menu builder → QR/share →
 * order a QR design (captures the lead).
 */
export default function GoFrPage() {
  return (
    <main dir="ltr" className="px-4 py-10 sm:py-16">
      <FunnelWizard dict={FR_DICT} appUrl={getAppUrl()} />
      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-neutral-400">
        MangeQR — votre carte, en 2 minutes.
      </p>
    </main>
  );
}
