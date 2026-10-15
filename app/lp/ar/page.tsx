import type { Metadata } from 'next';

import { Hero } from './_components/Hero';
import { ProofStrip } from './_components/ProofStrip';
import { Problem } from './_components/Problem';
import { Mechanism } from './_components/Mechanism';
import { Offer } from './_components/Offer';
import { Demo } from './_components/Demo';
import { Testimonials } from './_components/Testimonials';
import { ValueStack } from './_components/ValueStack';
import { PricingROI } from './_components/PricingROI';
import { Objections } from './_components/Objections';
import { Guarantee } from './_components/Guarantee';
import { FAQ } from './_components/FAQ';
import { FinalCTA } from './_components/FinalCTA';
import { Footer } from './_components/Footer';
import { JsonLd } from '@/components/seo/JsonLd';

const BASE_URL = 'https://www.mangeqr.com';

/**
 * SEO metadata for the Arabic landing page — targets Arabic-speaking restaurant
 * owners in Algeria, Morocco, Tunisia, and the Middle East.
 */
export const metadata: Metadata = {
  title: 'MangeQR — قائمة طعام رقمية برمز QR في دقيقتين',
  description:
    'أنشئ قائمة طعام رقمية أنيقة برمز QR لمطعمك في دقيقتين — بدون طباعة متكررة وبدون أي خبرة تقنية. حلّ متكامل: قائمة رقمية، رمز QR، تقييمات العملاء، متابعة الأداء.',
  keywords: [
    'قائمة طعام رقمية',
    'قائمة مطعم QR',
    'منيو رقمي مطعم',
    'رمز QR للمطعم',
    'قائمة طعام إلكترونية',
    'منيو الكتروني',
    'تطبيق قائمة مطعم',
    'قائمة QR مجانية',
    'منيو QR كود',
    'قائمة مطعم بدون طباعة',
    'menu QR code restaurant',
    'MangeQR',
  ],
  alternates: {
    canonical: `${BASE_URL}/lp/ar`,
    languages: {
      'ar-DZ': `${BASE_URL}/lp/ar`,
      'fr-FR': BASE_URL,
    },
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/lp/ar`,
    siteName: 'MangeQR',
    locale: 'ar_AR',
    alternateLocale: ['fr_FR'],
    title: 'MangeQR — قائمة طعام رقمية برمز QR',
    description:
      'أنشئ قائمة طعام رقمية أنيقة برمز QR لمطعمك في دقيقتين — بدون طباعة متكررة وبدون أي خبرة تقنية.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'MangeQR — قائمة مطعم رقمية',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MangeQR — قائمة طعام رقمية برمز QR',
    description:
      'أنشئ قائمة طعام رقمية أنيقة برمز QR لمطعمك في دقيقتين.',
    images: [`${BASE_URL}/og-image.png`],
  },
};

/**
 * Structured data for the Arabic landing page: Organization + SoftwareApplication
 * (Arabic descriptions) + FAQPage with the 4 Arabic Q&A pairs from the FAQ
 * component. Enables FAQ rich results in Arabic SERPs.
 */
function buildArabicJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'MangeQR',
        url: BASE_URL,
        logo: `${BASE_URL}/og-image.png`,
      },
      {
        '@type': 'SoftwareApplication',
        name: 'MangeQR',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: BASE_URL,
        inLanguage: 'ar',
        publisher: { '@id': `${BASE_URL}/#organization` },
        description:
          'أنشئ قوائم رقمية وورقية، اجمع تقييمات العملاء وتابع أداءك. قائمة محدَّثة دائمًا، دون إعادة طباعة.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
          description: 'تجربة مجانية، ثم ابتداءً من 12 يورو/شهر',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'هل MangeQR تطبيق؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'لا. MangeQR ليس تطبيقًا يتم تنزيله: عملاؤك لا يحتاجون إلى App Store. بمجرد مسح رمز QR يصلون إلى صفحة ويب تحتوي قائمة مطعمك.',
            },
          },
          {
            '@type': 'Question',
            name: 'هل إنشاء قائمة QR سهل؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'نعم. MangeQR مصمَّم ليكون بسيطًا. تنشئ مطعمك، تضيف قوائمك وأطباقك، ثم تحفظ. تُحدَّث القائمة فورًا وتتزامن مع رمز QR الموجود على الطاولات.',
            },
          },
          {
            '@type': 'Question',
            name: 'هل يمكنني تغيير الأسعار أو الأطباق لاحقًا؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'في أي وقت. طبق لم يعد متوفرًا؟ ادخل إلى مساحتك وأخفِه: يظهر باللون الرمادي للعملاء بدل أن يخيب أملهم على الطاولة.',
            },
          },
          {
            '@type': 'Question',
            name: 'كيف أستلم رموز QR الخاصة بي؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'تنزّل رموز QR بصيغة JPEG أو PDF مباشرة من مساحتك. في إصدار البيتا، نرسل لك أيضًا نموذجًا من حامل رمز QR.',
            },
          },
        ],
      },
    ],
  };
}

/**
 * Arabic (RTL) conversion-focused landing page for paid ads.
 *
 * Follows the Hormozi high-performance structure, engineering the value
 * equation at each stage: big promise → immediate proof → problem → new
 * mechanism → offer → demo → social proof → value stack → price/ROI →
 * objections → guarantee → FAQ → final CTA. The primary CTA (sign-up) repeats
 * at the hero, after the demo, in the value stack, ROI, and final sections.
 *
 * The /lp layout forces RTL + Arabic font and strips the app chrome.
 */
export default function ArabicLandingPage() {
  return (
    <main>
      <JsonLd data={buildArabicJsonLd()} />
      <Hero />
      <ProofStrip />
      <Problem />
      <Mechanism />
      <Offer />
      <Demo />
      <Testimonials />
      <ValueStack />
      <PricingROI />
      <Objections />
      <Guarantee />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
