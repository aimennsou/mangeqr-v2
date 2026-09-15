import type { Metadata } from 'next';

import { getAppUrl } from '@/lib/subdomain';
import FunnelWizard from '../_components/FunnelWizard';
import { AR_DICT } from '../_components/dict';

export const metadata: Metadata = {
  title: 'أنشئ قائمة QR مجانية في دقيقتين — MangeQR',
  description:
    'أنشئ قائمتك الرقمية واحصل على رمز QR ورابط للمشاركة. بدون حساب وبدون تثبيت.',
  robots: { index: false }
};

/**
 * Arabic lead-gen funnel (paid ads). RTL + Tajawal font (font-arabic). Same
 * anonymous flow as the French page with Arabic copy.
 */
export default function GoArPage() {
  return (
    <main dir="rtl" lang="ar" className="font-arabic px-4 py-10 sm:py-16">
      <FunnelWizard dict={AR_DICT} appUrl={getAppUrl()} />
      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-neutral-400">
        MangeQR — قائمتك في دقيقتين.
      </p>
    </main>
  );
}
